const express = require('express');
const router = express.Router();
const { client } = require('../models/dbConfig');
const bcrypt = require("bcrypt");
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');

const initializePassport = require('../models/passportConfig');

initializePassport(passport);

router.use(express.urlencoded({extended: false}));

router.use
  (session({
    secret: 'secret',

    resave: false,

    saveUninitialized: false
  })
);

router.use(passport.initialize());
router.use(passport.session());

router.use(flash())

router.get('/', checkAuthenticated, (req, res) => {
    res.render('index', { title: 'Saborsazzon' });
  });
  
  router.get('/about', checkAuthenticated, (req, res) => {
    res.render('about', { title: 'Acerca de' });
  });
  
  router.get('/loginCliente', checkAuthenticated, (req, res) => {
    res.render('./vistasCliente/loginCliente', { title: 'Inicio de sesión' });
  });
  
  router.get('/registroCliente', checkAuthenticated, (req, res) => {
    res.render('./vistasCliente/registroCliente', { title: 'Registro de usuario' });
  });

  router.get('/cliente', checkNotAuthenticated, (req, res) => {
    res.render('./vistasCliente/cliente', { user: req.user.nombres_cliente, title: 'Cliente Principal'});
  });

  router.get('/mesero', (req, res) => {
    res.render('./vistasEmpleado/mesero', {title: 'Mesero Principal'});
  });

  router.get("/logoutCliente", (req, res) => {
    req.logOut();
    req.flash("success_msg", "Has cerrado sesión");
    res.redirect("/loginCliente");
  });

  router.get("/logoutMesero", (req, res) => {
    req.logOut();
    req.flash("success_msg", "Has cerrado sesión");
    res.redirect("/loginEmpleado");
  }); 
  
  router.get('/loginEmpleado', (req, res) => {
    res.render('./vistasEmpleado/loginEmpleado', { title: 'Login Empledo' });
  });

  router.get('/admin', (req, res) => {
    res.render('./vistasEmpleado/admin', { title: 'Admin' });
  });

  router.get('/restaurante', checkNotAuthenticated, (req, res) => {
    res.render('./vistasCliente/restaurante', { title: 'Nuestro restaurante' });
  });

  router.get('/reservacion', checkNotAuthenticated, (req, res) => {
    res.render('./vistasCliente/reservacion', { title: 'Reservación' });
  });

  router.get('/chat', checkNotAuthenticated, (req, res) => {
    res.render('./vistasCliente/chatCliente', { title: 'Chat' });
  });

  router.get('/menu', checkNotAuthenticated, (req, res) => {
    res.render('./vistasCliente/menu', { title: 'Menú' });
  });

  router.get('/perfilCliente', checkNotAuthenticated, (req, res) => {
    res.render('./vistasCliente/perfilCliente', { title: 'Perfil Cliente', user: req.user});
  });

  //Registar un cliente-------------------------------------------
  router.post('/registroCliente',async (req, res) => {
    let{correo_user, contrasena_user, apodo_user, nombres_user, materno_user, paterno_user, contrasena_user2} = req.body;

    console.log({
      correo_user, contrasena_user, apodo_user, nombres_user, materno_user, paterno_user, contrasena_user2
    });
  
    let errors =[];
  
    if(!correo_user || !contrasena_user || !contrasena_user2 || !nombres_user || !paterno_user ){
      errors.push({message: "Por favor llenar todos los campos obligatorios"});
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
                res.redirect('/loginCliente');
              }
            );
          }
        }
      ); 
    }
  });

  //Iniciar sesión de un cliente-------------------------------------------
  router.post(
    '/loginCliente',
    passport.authenticate("local", {
      successRedirect: '/cliente',
      failureRedirect: '/loginCliente',
      failureFlash: true
    })
  );
  
  
  function checkAuthenticated(req, res, next){
    if (req.isAuthenticated()){
      return res.redirect('/cliente');
    }
    next();
  }
  
  function checkNotAuthenticated(req, res, next){
    if (req.isAuthenticated()){
      return next();
    }
    res.redirect('/loginCliente');
  }

  module.exports = router;