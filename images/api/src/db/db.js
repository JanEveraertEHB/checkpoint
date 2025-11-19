const { uuidv4 } =require("./../helpers/uuidHelpers");


const config = require("./knexfile.js")

const pg = require('knex')(config.development);

class DB {
  constructor() {
    if (DB.instance) return DB.instance

    this.pg = pg

    DB.instance = this
  }

  get() {
    return pg
  }



  async logAction(action, payload, student_id) {
    await pg("actions").insert({
      action, payload, student_id, uuid: uuidv4()
    }).returning("*").then((d) => {
      //console.log("inserted: " + d[0].uuid);
    })
  }

  async destroy() {
    await this.pg.destroy()
  }
}

module.exports = new DB()