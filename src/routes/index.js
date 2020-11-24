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

router.get('/', checkAuthenticatedCliente, (req, res) => {
    res.render('index', { title: 'Saborsazzon' });
  });
  
  router.get('/about', checkAuthenticatedCliente, (req, res) => {
    res.render('about', { title: 'Acerca de' });
  });
  
  router.get('/loginCliente', checkAuthenticatedCliente, (req, res) => {
    res.render('./vistasCliente/loginCliente', { title: 'Inicio de sesión' });
  });
  
  router.get('/registroCliente', checkAuthenticatedCliente, (req, res) => {
    res.render('./vistasCliente/registroCliente', { title: 'Registro de usuario' });
  });

  router.get('/cliente', checkNotAuthenticatedCliente, (req, res) => {
    res.render('./vistasCliente/cliente', { user: req.user.nombres_cliente, title: 'Cliente Principal'});
  });

  router.get('/mesero', checkNotAuthenticatedMesero, (req, res) => {
    res.render('./vistasMesero/mesero', {user: req.user.nombres_mesero, title: 'Mesero Principal'});
  });

  router.get("/logoutCliente", (req, res) => {
    req.logOut();
    req.flash("success_msg", "Has cerrado sesión");
    res.redirect("/loginCliente");
  });

  router.get("/logoutMesero", (req, res) => {
    req.logOut();
    req.flash("success_msg", "Has cerrado sesión");
    res.redirect("/loginMesero");
  }); 
  
  router.get("/logoutAdmin", (req, res) => {
    req.logOut();
    req.flash("success_msg", "Has cerrado sesión");
    res.redirect("/loginAdmin");
  });

  router.get('/loginMesero', checkAuthenticatedMesero, (req, res) => {
    res.render('./vistasMesero/loginMesero', { title: 'Login Mesero' });
  });

  router.get('/admin', checkNotAuthenticatedAdmin, (req, res) => {
    res.render('./vistasAdmin/admin', {user: req.user.nombres_administrador, title: 'Admin' });
  });

  router.get('/loginAdmin', checkAuthenticatedAdmin, (req, res) => {
    res.render('./vistasAdmin/loginAdmin', { title: 'Login Admin' });
  });

  router.get('/restaurante', checkNotAuthenticatedCliente, (req, res) => {
    res.render('./vistasCliente/restaurante', { title: 'Nuestro restaurante' });
  });

  router.get('/reservacion', checkNotAuthenticatedCliente, (req, res) => {
    res.render('./vistasCliente/reservacion', { title: 'Reservación' });
  });

  router.get('/chatCliente', checkNotAuthenticatedCliente, (req, res) => {
    res.render('./vistasCliente/chatCliente', { title: 'Chat Cliente', user: req.user});
  });

  router.get('/chatMesero', checkNotAuthenticatedCliente, (req, res) => {
    res.render('./vistasMesero/chatMesero', { title: 'Chat Mesero', user: req.user});
  });

  router.get('/menu', checkNotAuthenticatedCliente, (req, res) => {
    res.render('./vistasCliente/menu', { title: 'Menú' });
  });

  router.get('/perfilCliente', checkNotAuthenticatedCliente, (req, res) => {
    res.render('./vistasCliente/perfilCliente', { title: 'Perfil Cliente', user: req.user});
  });

  router.get('/gestionEmpleados', checkNotAuthenticatedAdmin, (req, res) => {
    res.render('./vistasAdmin/gestionEmpleados', { title: 'Empleados', user: req.user});
  });

  router.get('/gestionReservas', checkNotAuthenticatedAdmin, (req, res) => {
    res.render('./vistasAdmin/gestionReservas', { title: 'Reservas', user: req.user});
  });

  function construirApodo(apodo, nombres, paterno, materno, contrasena){
    
    if(apodo === ''){
      return nombres.trim() + paterno.slice(0,1) + materno.slice(0,1) + contrasena.slice(0,1) + contrasena.slice(-1);
    } else {
      return apodo;
    }
  }

  //Registar un cliente-------------------------------------------
  router.post('/registroCliente',async (req, res) => {
    let{correo_user, contrasena_user, apodo_user, nombres_user, materno_user, paterno_user, contrasena_user2} = req.body;

    console.log({
      correo_user, contrasena_user, apodo_user, nombres_user, materno_user, paterno_user, contrasena_user2
    });

    apodo_construido_user = construirApodo(apodo_user, nombres_user, paterno_user, materno_user , contrasena_user)
  
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
      res.render("./vistasCliente/registroCliente", {errors});
    }else{
      //encriptar contraseña
      let hashedContrasena= await bcrypt.hash(contrasena_user, 10);
      console.log("hashedContrasena: ");
      console.log(hashedContrasena);
      client.connect()
      client.query(
        `SELECT * FROM cliente
          WHERE correo_cliente = $1 or apodo_cliente = $2;`,
        [correo_user, apodo_construido_user],
        (err, results) => {
          if (err) {
            console.log(err);
          }
          console.log(results.rows);
  
          if(results.rows.length > 0){
            errors.push({message: "El usuario ya se encuentra registrado"});
            res.render("./vistasCliente/registroCliente", {errors});
          }else{
            client.query(
              `INSERT INTO cliente VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING correo_cliente`, 
              [correo_user, hashedContrasena, apodo_construido_user, nombres_user, paterno_user, materno_user],
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


  //Reserva cliente--------------------------------------------------------
  router.post('/reservacion',async (req, res) => {
    const {dia_user, hora_user} = req.body;
    console.log({
     dia_user, hora_user
    });
    let errors =[];

    id_reservas = dia_user + hora_user;

    AM_or_PM = hora_user.slice(-2)
    hora_int_siguiente = parseInt(hora_user.slice(2, -2)) + 1;
    hora_siguiente_user = hora_int_siguiente.toString() + AM_or_PM;
  
    if(!dia_user || !hora_user){
      errors.push({message: "Por favor llenar todos los campos obligatorios"});
    }
  
  
    if(errors.length > 0){
      res.render('./vistasCliente/reservacion', {errors});
    }else{
      client.query(
      `SELECT * FROM reserva
        WHERE dia_user = $1 and (hora_user = $2 or hora_user = $3);`,
      [dia_user, hora_user, hora_siguiente_user],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if(results.rows.length > 0){
          errors.push({message: "Ya se encuentra reservado para esta hora"});
          res.render('./vistasCliente/reservacion', {errors});
        }else{
          client.query(
            `INSERT INTO reserva VALUES ($1, $2, $3)`, 
            [id_reservas, dia_user, hora_user],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "Se ha reservado exitosamente");
              res.redirect('/cliente');
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
    passport.authenticate("cliente-local", {
      successRedirect: '/cliente',
      failureRedirect: '/loginCliente',
      failureFlash: true
    })
  );


  // iniciar sesión como empleado
  router.post(
    '/loginMesero',
    passport.authenticate("mesero-local", {
      successRedirect: '/mesero',
      failureRedirect: '/loginMesero',
      failureFlash: true
    })
  );


  // iniciar sesión como empleado
  router.post(
    '/loginAdmin',
    passport.authenticate("admin-local", {
      successRedirect: '/admin',
      failureRedirect: '/loginAdmin',
      failureFlash: true
    })
  );

  
  
  function checkAuthenticatedCliente(req, res, next){
    if (req.isAuthenticated()){
      return res.redirect('/cliente');
    }
    next();
  }
  
  function checkNotAuthenticatedCliente(req, res, next){
    if (req.isAuthenticated()){
      return next();
    }
    res.redirect('/loginCliente');
  }

  function checkNotAuthenticatedMesero(req, res, next){
    if (req.isAuthenticated()){
      return next();
    }
    res.redirect('/loginMesero');
  }

  function checkAuthenticatedMesero(req, res, next){
    if (req.isAuthenticated()){
      return res.redirect('/mesero');
    }
    next();
  }


  function checkNotAuthenticatedAdmin(req, res, next){
    if (req.isAuthenticated()){
      return next();
    }
    res.redirect('/loginAdmin');
  }


  function checkAuthenticatedAdmin(req, res, next){
    if (req.isAuthenticated()){
      return res.redirect('/admin');
    }
    next();
  }

  module.exports = router;