const supertest = require('supertest');
const app = require('../../server.js');
const {createTables} = require("./../../helpers/dbHelper")
const request = supertest(app);


const pg = require('knex')({
  client: 'pg',
  connection: {
    host : process.env.POSTGRES_HOST ? process.env.POSTGRES_HOST : "localhost",
    port : 5432,
    user : process.env.POSTGRES_USER ? process.env.POSTGRES_USER : "test",
    password : process.env.POSTGRES_PASSWORD ? process.env.POSTGRES_PASSWORD : "test",
    database : process.env.POSTGRES_DATABASE ? process.env.POSTGRES_DATABASE : "test"
  }
});
beforeAll(() => {
  return createTables(pg);
});
describe('/ endpoint', () => {

  test('GET /users endpoint ', (done) => {
      // run code
      async function cb() {
        try {
          const response = await request.get('/users')
          expect(response.status).toBe(200);

          expect(response.body.length).toBeGreaterThanOrEqual(0);
          if(response.body.length > 0) {
            // test the actual body
          }
          done();
        } catch(e) {
          done(e)
        }
      }
      cb();
  })
  test('POST /users endpoint empty ', (done) => {
    // run code
    request.post('/users')
    .then((response) => {
      expect(response.status).toBe(400);
      done();
    })
    .catch((e) => {
      done(e)
    })
  })

  test('POST /users endpoint full ', (done) => {
    request.post('/users')
      .send({first_name: 'test', last_name: 'bar', password: 'test' })      
      .then((response) => {
        expect(response.status).toBe(200);
        done();
      })
      .catch((e) => {
        done(e)
      })
  })

  test("has been added", (done) => {
    pg.select("*").table("users").where({first_name: 'test'}).then((data) => {
      expect(data.length).toBeGreaterThanOrEqual(1);
      done();
    })
  })

})



afterAll(() => {
  return pg.delete("*").table("users").where({first_name: "test"}).then((d) => {
    pg.destroy()
  })
});