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
    res.render('./vistasAdmin/admin', { title: 'Admin' });
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
  
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
 }

  async function getEmpleados(){
    let admins = ''
    let meseros = ''
    client.connect()
    client.query(
        `SELECT * FROM administrador`,
        (err, results) => {
            if (err) {
                throw err;
            }
            if (results.rows.length > 0) {
              admins = results.rows
              client.query(
                  `SELECT * FROM mesero`,
                  (err, results) => {
                      if (err) {
                          throw err;
                      }
                      if (results.rows.length > 0) {
                        meseros = results.rows
                      } else {
                        // No empleados
                      }
                  }
              )
            } else {
              // No empleados
            }
        }
    )
    await sleep(1000);
    return JSON.stringify([admins, meseros])
  }


  router.get('/gestionEmpleados', checkNotAuthenticatedAdmin,async (req, res) => {
    res.render('./vistasAdmin/gestionEmpleados', { title: 'Empleados', user: req.user, db:await getEmpleados()});
  });

  router.get('/gestionReservas', checkNotAuthenticatedAdmin, (req, res) => {
    res.render('./vistasAdmin/gestionReservas', { title: 'Reservas', user: req.user});
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


  //Reserva cliente--------------------------------------------------------
  router.post('/reservacion',async (req, res) => {
    let{dia_user, hora_user, numpersonas_user} = req.body;

    console.log({
      dia_user, hora_user, numpersonas_user
    });
  
    let errors =[];
  
    if(!dia_user || !hora_user || numpersonas_user ){
      errors.push({message: "Por favor llenar todos los campos obligatorios"});
    }
  
    if(numpersonas_user.length > 1){
      errors.push({message: "Indique un numero de personas valido"});
    }
  
  
    if(errors.length > 0){
      res.render("reservacion", {errors});
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

  router.post('/addEmployeeModal',async (req, res) => {
      let{correo_empleado, nombres_empleado, materno_empleado, paterno_empleado, rol_empleado} = req.body;
      
      let contrasena_empleado = paterno_empleado;
      let contrasena_empleado2 = paterno_empleado;
      let nombres = nombres_empleado.split(" ");
      let apodo = ''
      for(var i= 0; i < nombres.length; i++){
        apodo += nombres[i]
      }
      let apodo_empleado = apodo + paterno_empleado
      
      console.log({
        correo_empleado, contrasena_empleado, apodo_empleado, nombres_empleado, materno_empleado, paterno_empleado, contrasena_empleado2, rol_empleado
      });
    
      let errors =[];
    
      if(!correo_empleado || !nombres_empleado || !paterno_empleado ){
        errors.push({message: "Por favor llenar todos los campos obligatorios"});
      }
    
      if(errors.length > 0){
        res.render("registro", {errors});
      }else{
        //encriptar contraseña
        let hashedContrasena= await bcrypt.hash(contrasena_empleado, 10);
        console.log("hashedContrasena: ");
        console.log(hashedContrasena);
        if(rol_empleado == 1){
          client.connect()
          client.query(
            `SELECT * FROM administrador
              WHERE correo_administrador = $1 or apodo_administrador = $2;`,
            [correo_empleado, apodo_empleado],
            (err, results) => {
              if (err) {
                throw err;
              }
              if(results.rows.length > 0){
                errors.push({message: "El admin ya se encuentra registrado"});
                res.render("registro", {errors});
              }else{
                client.query(
                  `INSERT INTO administrador VALUES ($1, $2, $3, $4, $5, $6)
                  RETURNING correo_administrador`, 
                  [correo_empleado, hashedContrasena, apodo_empleado, nombres_empleado, paterno_empleado, materno_empleado],
                  (err, results) => {
                    if (err) {
                      throw err;
                    }
                    console.log(results.rows);
                    req.flash("success_msg", "Se ha registrado exitosamente el admin");
                    res.redirect('/gestionEmpleados');
                  }
                );
              }
            }
          );
        } else {
          client.connect()
          client.query(
            `SELECT * FROM mesero
              WHERE correo_mesero = $1 or apodo_mesero = $2;`,
              [correo_empleado, apodo_empleado],
            (err, results) => {
              if (err) {
                throw err;
              }
              if(results.rows.length > 0){
                errors.push({message: "El mesero ya se encuentra registrado"});
                res.render("registro", {errors});
              }else{
                client.query(
                  `INSERT INTO mesero VALUES ($1, $2, $3, $4, $5, $6)
                  RETURNING correo_mesero`, 
                  [correo_empleado, hashedContrasena, apodo_empleado, nombres_empleado, paterno_empleado, materno_empleado],
                  (err, results) => {
                    if (err) {
                      throw err;
                    }
                    console.log(results.rows);
                    req.flash("success_msg", "Se ha registrado exitosamente el mesero");
                    res.redirect('/gestionEmpleados');
                  }
                );
              }
            }
          );
        }
      }
  });
  
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