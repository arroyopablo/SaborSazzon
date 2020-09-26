const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const session = require('express-session');
const flash = require('express-flash');

var pgp = require("pg-promise")(/*options*/);
var db = pgp("postgres://ukgerkfqbjoyxb:2e4f52321c055f56a6880dd07d259a0cf228d474ff18bcb0e66a700f357c5c65@ec2-54-86-57-171.compute-1.amazonaws.com:5432/dcep7v2k1ggvsr");


router.use(express.urlencoded({extended: false}));

router.use
  (session({
    secret: 'secret',

    resave: false,

    saveUninitialized: false
  })
);

router.use(flash())

router.get('/', (req, res) => {
    res.render('index', { title: 'Saborsazzon' });
  });
  
  router.get('/about', (req, res) => {
    res.render('about', { title: 'Acerca de' });
  });
  
  router.get('/login', (req, res) => {
    res.render('login', { title: 'Inicio de sesión' });
  });
  
  router.get('/registro', (req, res) => {
    res.render('registro', { title: 'Registro de usuario' });
  });

  //Registar un cliente-------------------------------------------
  router.post('/registro',async (req, res) => {
    let{correo_user,apodo_user,contraseña_user, contraseña_user2, nombres_user, paterno_user, materno_user} = req.body;

    console.log({
      correo_user,apodo_user,contraseña_user, contraseña_user2, nombres_user, paterno_user, materno_user
    });
  
    let errors =[];
  
    if(!correo_user || !apodo_user || !contraseña_user || !contraseña_user2 || !nombres_user || !paterno_user || !materno_user){
      errors.push({message: "Por favor llenar todos los campos"});
    }
  
    if(contraseña_user.length < 6){
      errors.push({message: "La contraseña debe ser de al menos 6 caracteres"});
    }
  
    if(contraseña_user != contraseña_user2){
      errors.push({message: "La contraseña no coincide"});
    }
  
    if(errors.length > 0){
      res.render("registro", {errors});
    }else{
      let hashedContrasena= await bcrypt.hash(contraseña_user, 10);
      console.log(hashedContrasena);
      db.connect()
      db.query(
        `SELECT * FROM cliente
          WHERE correo_user = $1 or apodo_user = $2`,
        [apodo_user, correo_user],
        (err, results) => {
          if (err) {
            console.log(err);
          }
          console.log(results.rows);
  
          if(results.rows.length > 0){
            errors.push({message: "El usuario ya se encuentra registrado, prueba con una cédula o celular diferente"});
            res.render("registro", {errors});
          }else{
            db.query(
              `INSERT INTO cliente VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING correo_user`, 
              [correo_user,apodo_user, nombres_user, paterno_user, materno_user, hashedContrasena],
              (err, results) => {
                if (err) {
                  throw err;
                }
                console.log(results.rows);
                req.flash("success_msg", "Se ha registrado exitosamente, por favor ínicia sesión");
                res.redirect('/login');
              }
            );
          }
        }
      ); 
    }
  });

  module.exports = router;