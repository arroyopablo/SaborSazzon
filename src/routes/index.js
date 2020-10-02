const express = require('express');
const router = express.Router();
const { client } = require('../models/dbConfig');
const bcrypt = require("bcrypt");
const session = require('express-session');
const flash = require('express-flash');

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

  router.get('/cliente', (req, res) => {
    res.render('cliente', { title: 'Cliente Principal' });
  });

  router.get('/loginadmin', (req, res) => {
    res.render('loginadmin', { title: 'Login Admin' });
  });

  router.get('/admin', (req, res) => {
    res.render('admin', { title: 'Admin' });
  });

  //Registar un cliente-------------------------------------------
  router.post('/registro',async (req, res) => {
    let{correo_user, contrasena_user, apodo_user, nombres_user, materno_user, paterno_user, contrasena_user2} = req.body;

    console.log({
      correo_user, contrasena_user, apodo_user, nombres_user, materno_user, paterno_user, contrasena_user2
    });
  
    let errors =[];
  
    if(!correo_user || !apodo_user || !contrasena_user || !contrasena_user2 || !nombres_user || !paterno_user || !materno_user){
      errors.push({message: "Por favor llenar todos los campos"});
    }
  
    if(contrasena_user.length < 6){
      errors.push({message: "La contraseña debe ser de al menos 6 caracteres"});
    }
  
    if(contrasena_user != contrasena_user2){
      errors.push({message: "La contraseña no coincide"});
    }
  
    if(errors.length > 0){
      res.render("registro", {errors});
    }else{
      //encriptar contraseña
      let hashedContrasena= await bcrypt.hash(contrasena_user, 10);
      console.log("hashedContrasena: ");
      console.log(hashedContrasena);
      client.connect()
      client.query(
        `SELECT * FROM cliente
          WHERE correo_cliente = $1 or apodo_cliente = $2;`,
        [correo_user, apodo_user],
        (err, results) => {
          if (err) {
            console.log(err);
          }
          console.log(results.rows);
  
          if(results.rows.length > 0){
            errors.push({message: "El usuario ya se encuentra registrado"});
            res.render("registro", {errors});
          }else{
            client.query(
              `INSERT INTO cliente VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING correo_cliente`, 
              [correo_user, hashedContrasena, apodo_user, nombres_user, paterno_user, materno_user],
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