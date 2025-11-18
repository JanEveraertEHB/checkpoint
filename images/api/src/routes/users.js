const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { checkBodyFields } =require("./../helpers/bodyHelpers");
const { uuidv4 } =require("./../helpers/uuidHelpers");
const {decodeToken} = require("./../helpers/authHelpers")

const pg = require('./../db/db.js')

const SALT_ROUNDS = 10;

const getInfo = (req) => {
  return {
    ip: req.ip,
    ips: req.ips,
    remote: req.socket.remoteAddress,
    method: req.method,
    url: req.originalUrl,
    ua: req.get('User-Agent'),
    referer: req.get('Referer'),
    lang: req.get('Accept-Language'),
    contentType: req.get('Content-Type'),
    tls: req.socket.encrypted ? {
      proto: req.socket.getProtocol(),
      cipher: req.socket.getCipher()
    } : null,
    sessionId: req.session?.id
  };
}

router.get('/validate_token', decodeToken, (req, res) => {
  const info = getInfo(req);
  if(req.user) {
    delete req.user.password;
    pg.logAction("login", info, req.user.uuid); 
    res.send(req.user);
  } else {
    res.status(400).send()
  }
})

router.post('/login', async (req, res) => {
  const info = getInfo(req);
  if(req.body) {
    if(checkBodyFields(req.body, ["email", "password"])) {
      try {
        const data = await pg.get()("users").select("*").where({ email: req.body.email });
        if(data.length > 0) {
          // Check if account is deleted
          if (data[0].deleted_at) {
            return res.status(403).send({ "message": "This account has been deleted" });
          }

          const validPassword = await bcrypt.compare(req.body.password, data[0].password);
          if (validPassword) {
            pg.logAction("login", info, data[0].uuid);
            const userWithoutPassword = { ...data[0] };
            delete userWithoutPassword.password;
            const token = jwt.sign(userWithoutPassword, process.env.TOKEN_ENCRYPTION);
            res.status(200).send({...userWithoutPassword, token, message: "success"})
          } else {
            res.status(400).send({ "message": "wrong credentials"})
          }
        } else {
          res.status(400).send({ "message": "wrong credentials"})
        }
      } catch(e) {
        console.log(e)
        res.status(501).send()
      }
    }
    else {
      res.status(402).send({ "fields": "no"})
    }
  } else {
    res.status(401).send({"message": "no"})
  }
})

router.post('/register', async (req, res) => {
  if(req.body) {
    if(checkBodyFields(req.body, ["first_name", "last_name", "email", "password"])) {
      try {
        // Check if email already exists
        const existingUser = await pg.get()("users")
          .where({ email: req.body.email })
          .first();

        if (existingUser) {
          return res.status(400).send({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);
        const userData = {
          uuid: uuidv4(),
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          email: req.body.email,
          password: hashedPassword
        };

        const data = await pg.get()("users").insert(userData).returning("*");
        console.log(data)
        pg.logAction("register", { ...req.body, password: '[REDACTED]' }, data[0].uuid);

        const userWithoutPassword = { ...data[0] };
        delete userWithoutPassword.password;
        const token = jwt.sign(userWithoutPassword, process.env.TOKEN_ENCRYPTION);

        res.status(200).send({...userWithoutPassword, token, message: "success"})
      } catch(e) {
        console.log(e)
        // Check if it's a unique constraint error
        if (e.code === '23505' || e.constraint === 'users_email_unique') {
          return res.status(400).send({ message: "Email already in use" });
        }
        res.status(501).send({ message: "Registration failed" })
      }
    }
    else {
      res.status(402).send({ "fields": "no"})
    }
  } else {
    res.status(401).send({"message": "no"})
  }
})

// Get user profile
router.get('/profile', decodeToken, async (req, res) => {
  try {
    const user = await pg.get()('users')
      .where({ uuid: req.user.uuid })
      .first();

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    delete user.password;
    res.status(200).send(user);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error fetching profile" });
  }
});

// Update user profile
router.put('/profile', decodeToken, async (req, res) => {
  try {
    const { first_name, last_name, email, date_of_birth } = req.body;
    const updateData = {};

    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (email) updateData.email = email;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).send({ message: "No fields to update" });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await pg.get()('users')
        .where({ email })
        .whereNot({ uuid: req.user.uuid })
        .first();

      if (existingUser) {
        return res.status(400).send({ message: "Email already in use" });
      }
    }

    await pg.get()('users')
      .where({ uuid: req.user.uuid })
      .update(updateData);

    const updatedUser = await pg.get()('users')
      .where({ uuid: req.user.uuid })
      .first();

    delete updatedUser.password;

    // Generate new token with updated info
    const token = jwt.sign(updatedUser, process.env.TOKEN_ENCRYPTION);

    res.status(200).send({ ...updatedUser, token, message: "Profile updated successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error updating profile" });
  }
});

// Change password
router.put('/password', decodeToken, async (req, res) => {
  if (!req.body || !req.body.current_password || !req.body.new_password) {
    return res.status(400).send({ message: "Current and new password required" });
  }

  try {
    const user = await pg.get()('users')
      .where({ uuid: req.user.uuid })
      .first();

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(req.body.current_password, user.password);
    if (!validPassword) {
      return res.status(403).send({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(req.body.new_password, SALT_ROUNDS);

    await pg.get()('users')
      .where({ uuid: req.user.uuid })
      .update({ password: hashedPassword });

    res.status(200).send({ message: "Password updated successfully" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Error updating password" });
  }
});

// Delete account
router.delete('/account', decodeToken, async (req, res) => {
  const trx = await pg.get().transaction();

  try {
    const userUuid = req.user.uuid;

    // Check if user exists and is not already deleted
    const user = await trx('users')
      .where({ uuid: userUuid })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      await trx.rollback();
      return res.status(404).send({ message: "User not found or already deleted" });
    }

    // Anonymize user data
    await trx('users')
      .where({ uuid: userUuid })
      .update({
        first_name: '[Deleted]',
        last_name: 'User',
        email: `deleted_${userUuid}@deleted.local`,
        password: await bcrypt.hash(uuidv4(), SALT_ROUNDS), // Random unguessable password
        deleted_at: new Date(),
        date_of_birth: null
      });

    // Update all feedback items created by this user to show account removal
    await trx('feedback')
      .where({ created_by_uuid: userUuid })
      .update({
        content: '[Student account removed]'
      });

    // Delete feedback images created by this user
    await trx('feedback_images')
      .whereIn('feedback_uuid', function() {
        this.select('uuid')
          .from('feedback')
          .where({ created_by_uuid: userUuid });
      })
      .delete();

    // Delete feedback documents created by this user (if table exists)
    const hasDocumentsTable = await trx.schema.hasTable('feedback_documents');
    if (hasDocumentsTable) {
      await trx('feedback_documents')
        .whereIn('feedback_uuid', function() {
          this.select('uuid')
            .from('feedback')
            .where({ created_by_uuid: userUuid });
        })
        .delete();
    }

    // Mark user as inactive in all classrooms
    await trx('classroom_members')
      .where({ user_uuid: userUuid })
      .update({ active: false });

    // Delete feedback requests by this user
    const hasFeedbackRequestsTable = await trx.schema.hasTable('feedback_requests');
    if (hasFeedbackRequestsTable) {
      await trx('feedback_requests')
        .where({ student_uuid: userUuid })
        .delete();
    }

    // Delete feedback demands for this user
    const hasFeedbackDemandsTable = await trx.schema.hasTable('feedback_demands');
    if (hasFeedbackDemandsTable) {
      await trx('feedback_demands')
        .where({ student_uuid: userUuid })
        .delete();
    }

    // Log the deletion action
    pg.logAction("account_deleted", { user_uuid: userUuid }, userUuid);

    await trx.commit();
    res.status(200).send({ message: "Account deleted successfully" });
  } catch (e) {
    await trx.rollback();
    console.log(e);
    res.status(500).send({ message: "Error deleting account" });
  }
});

module.exports = router
