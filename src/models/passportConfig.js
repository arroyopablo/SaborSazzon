const LocalStrategy = require("passport-local").Strategy;
const { client } = require("./dbConfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
  console.log("Initialized");

  const authenticateUser = (correo_login, contrasena_login, done) => {
    console.log(correo_login, contrasena_login);    
    client.connect()
    client.query(
      `SELECT * FROM cliente WHERE correo_cliente = $1`,
      [correo_login],
      (err, results) => {
        if (err) {
          throw err;
        }
        console.log(results.rows);
        if (results.rows.length > 0) {
          const user = results.rows[0];

          bcrypt.compare(contrasena_login, user.contraseña_cliente, (err, isMatch) => {
            if (err) {
              console.log(err);
            }
            if (isMatch) {
              return done(null, user);
            } else {
              //password es incorrecta
              return done(null, false, { message: "La contraseña es incorrecta" });
            }
          });
        } else {
          // No user
          return done(null, false, {
            message: "No existia un usuario registrado con ese correo"
          });
        }
      }
    );
  };

  passport.use(
    new LocalStrategy(
      { usernameField: "correo_login", passwordField: "contrasena_login" },
      authenticateUser
    )
  );
  // Stores user details inside session. serializeUser determines which data of the user
  // object should be stored in the session. The result of the serializeUser method is attached
  // to the session as req.session.passport.user = {}. Here for instance, it would be (as we provide
  //   the user id as the key) req.session.passport.user = {id: 'xyz'}
  passport.serializeUser((user, done) => done(null, user.correo_cliente));

  // In deserializeUser that key is matched with the in memory array / database or any data resource.
  // The fetched object is attached to the request object as req.user

  passport.deserializeUser((correo_login, done) => {
    client.query(`SELECT * FROM cliente WHERE correo_cliente = $1`, [correo_login], (err, results) => {
      if (err) {
        return done(err);
      }
      console.log(`El correo es ${results.rows[0].correo_cliente}`);
      return done(null, results.rows[0]);
    });
  });
}

module.exports = initialize;