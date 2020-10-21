const LocalStrategy = require("passport-local").Strategy;
const { client } = require("./dbConfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
  console.log("Initialized");

  const authenticateUser = (correo_o_apodo_login, contrasena_login, done) => {
    console.log(correo_o_apodo_login, contrasena_login);    
    client.connect()
    client.query(
      `SELECT * FROM cliente WHERE correo_cliente = $1 or apodo_cliente = $2`,
      [correo_o_apodo_login, correo_o_apodo_login],
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

  const authenticateEmpleado = (correo_o_apodo_login, contrasena_login, done) => {
    console.log(correo_o_apodo_login, contrasena_login);    
    client.connect()
    client.query(
      `SELECT * FROM mesero WHERE correo_mesero = $1 or apodo_mesero = $2`,
      [correo_o_apodo_login, correo_o_apodo_login],
      (err, results) => {
        if (err) {
          err
        }
        if (results.rows.length > 0) {
          const mesero = results.rows[0];
          bcrypt.compare(contrasena_login, mesero.contraseña_mesero, (err, isMatch) => {
            if (err) { 
              console.log
            }
            if (isMatch) {
              return done(null, mesero);
            } else {
              //password es incorrecta
              return done(null, false, { message: "La contraseña es incorrecta" });
            }
          });
        } else {
          // No user
          return done(null, false, {
            message: "No existia un empleado registrado con ese correo"
          });
        }
      }
    );
  };

  passport.use('cliente-local',
    new LocalStrategy(
      { usernameField: "correo_o_apodo_login", passwordField: "contrasena_login" },
      authenticateUser
    )
  );

  passport.use('empleado-local',
    new LocalStrategy(
      { usernameField: "correo_o_apodo_login", passwordField: "contrasena_login" },
      authenticateEmpleado
    )
  );
  // Stores user details inside session. serializeUser determines which data of the user
  // object should be stored in the session. The result of the serializeUser method is attached
  // to the session as req.session.passport.user = {}. Here for instance, it would be (as we provide
  //   the user id as the key) req.session.passport.user = {id: 'xyz'}
  passport.serializeUser(function (user, done) {

    var correo = null
    if(user.correo_cliente != undefined){
      correo = user.correo_cliente
    }

    if(user.correo_mesero != undefined){
      correo = user.correo_mesero
    }

    if(user.correo_administrador != undefined){   // FALTA HACER EL ADMIN
      correo = user.correo_administrador
    }

    done(null, correo)
  } );


  // In deserializeUser that key is matched with the in memory array / database or any data resource.
  // The fetched object is attached to the request object as req.user

  passport.deserializeUser((correo_o_apodo_login, done) => {
    client.query(`SELECT * FROM cliente WHERE correo_cliente = $1`, [correo_o_apodo_login], (err, resultsC) => {
      if (err) {
        return done(err)
      }
      if(resultsC.rowCount != 0){
        console.log(`El cliente es ${resultsC.rows[0]}`);
        return done(null, resultsC.rows[0]);
      }
      client.query(`SELECT * FROM mesero WHERE correo_mesero = $1`, [correo_o_apodo_login], (err, resultsM) => {
        if (err) {
          return done(err)
        }
        if(resultsM.rowCount != 0){
          console.log(`El mesero es ${resultsM.rows[0]}`);
          return done(null, resultsM.rows[0]);
        }
        client.query(`SELECT * FROM administrador WHERE correo_administrador = $1`, [correo_o_apodo_login], (err, resultsA) => {
          if (err) {
            return done(err);
          }
          console.log(`El admin es ${resultsA.rows[0]}`);
          return done(null, resultsA.rows[0]);
        })
      })
    });
  });



}

module.exports = initialize;