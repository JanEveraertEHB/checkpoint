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

module.exports = router
