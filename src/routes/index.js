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
    res.render('./vistasCliente/reservacion', {user: req.user.correo_cliente, title: 'Reservación' });
  });

  router.get('/chatCliente', checkNotAuthenticatedCliente, (req, res) => {
    res.render('./vistasCliente/chatCliente', { title: 'Chat Cliente', user: req.user});
  });

  router.get('/interfazChatCliente', checkNotAuthenticatedCliente, (req, res) => {
    res.render('./vistasCliente/interfazChatCliente', { title: 'Chat Cliente', user: req.user});
  });

  router.get('/interfazChatMesero', checkNotAuthenticatedMesero, (req, res) => {
    res.render('./vistasMesero/interfazChatMesero', { title: 'Chat Mesero', user: req.user});
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

  async function getDates(){
    var data = null;
    client.connect()
    client.query(`SELECT * FROM reserva;`, 
      (err, results) => { 
        if (err) {
          console.log(err);
        }
        // Falta modificar
        if(results.rows.length > 0){
          console.log("SI ENTRO A LA BASE DE DATOS")

          var hora_reserva = null;
          var id_reserva = null;
          var hora_int_siguiente = null;
          var hora_siguiente_reserva = null;
          var AM_o_PM = null;

          var evento = null;
          var dia = null;
          

          var eventos = []
          var dias =[]
          var meses = []
          var anos = []

          var reservas = results.rows;
          for(var i = 0; i < reservas.length; i++){
            fecha_reserva = reservas[i].dia_user;
            ano_reserva = fecha_reserva.slice(0,4);
            mes_reserva = (fecha_reserva.slice(0,7)).slice(-2);
            dia_reserva = fecha_reserva.slice(-2);
            
            hora_reserva = reservas[i].hora_user;
            id_reserva = reservas[i].id_cliente;
            hora_int_siguiente = parseInt(hora_reserva.slice(0, -2)) + 1;
            hora_siguiente_reserva = hora_int_siguiente.toString();

            AM_o_PM = hora_reserva.slice(-2);

            evento = {
              startTime: hora_reserva,
              endTime: hora_siguiente_reserva,
              mTime: AM_o_PM,
              text: id_reserva
            }
            eventos.push(evento)
            reservas.splice(i,1)
            for(var j = 0; j < reservas.length; j++){
              fecha_next_reserva = reservas[j].dia_user;
              ano_next_reserva = fecha_next_reserva.slice(0,4);
              mes_next_reserva = (fecha_next_reserva.slice(0,7)).slice(-2);
              dia_next_reserva = fecha_next_reserva.slice(-2);
              if(ano_reserva === ano_next_reserva && mes_next_reserva === mes_reserva && dia_next_reserva === dia_reserva){
                hora_reserva = reservas[j].hora_user;
                id_reserva = reservas[j].id_cliente;
                hora_int_siguiente = parseInt(hora_reserva.slice(0, -2)) + 1;
                hora_siguiente_reserva = hora_int_siguiente.toString();
                AM_o_PM = hora_reserva.slice(-2);

                evento = {
                  startTime: hora_reserva,
                  endTime: hora_siguiente_reserva,
                  mTime: AM_o_PM,
                  text: id_reserva
                }
                eventos.push(evento)
                reservas.splice(j,1)
              }
            }



            for(var w = 0; w < reservas.length; w++){
              fecha_next_reserva = reservas[w].dia_user;
              ano_next_reserva = fecha_next_reserva.slice(0,4);
              mes_next_reserva = (fecha_next_reserva.slice(0,7)).slice(-2);
              dia_next_reserva = fecha_next_reserva.slice(-2);

              if(ano_reserva === ano_next_reserva && mes_next_reserva === mes_reserva){
                hora_reserva = reservas[w].hora_user;
                id_reserva = reservas[w].id_cliente;
                hora_int_siguiente = parseInt(hora_reserva.slice(0, -2)) + 1;
                hora_siguiente_reserva = hora_int_siguiente.toString();
                AM_o_PM = hora_reserva.slice(-2);
  
                evento = {
                  startTime: hora_reserva,
                  endTime: hora_siguiente_reserva,
                  mTime: AM_o_PM,
                  text: id_reserva
                }
                eventos.push(evento)
                reservas.splice(w,1)

                for(var w1 = 0; w1 < reservas.length; w1++){ 
                  fecha_next_next_reserva = reservas[w1].dia_user;
                  ano_next_next_reserva = fecha_next_next_reserva.slice(0,4);
                  dia_next_next_reserva = fecha_next_next_reserva.slice(-2);
                  mes_next_next_reserva = (fecha_next_next_reserva.slice(0,7)).slice(-2);
                  if(ano_next_next_reserva === ano_next_reserva && mes_next_reserva === mes_next_next_reserva && dia_next_next_reserva === dia_next_reserva){
                    hora_reserva = reservas[w1].hora_user;
                    id_reserva = reservas[w1].id_cliente;
                    hora_int_siguiente = parseInt(hora_reserva.slice(0, -2)) + 1;
                    hora_siguiente_reserva = hora_int_siguiente.toString();
                    AM_o_PM = hora_reserva.slice(-2);

                    evento = {
                      startTime: hora_reserva,
                      endTime: hora_siguiente_reserva,
                      mTime: AM_o_PM,
                      text: id_reserva
                    }
                    eventos.push(evento)
                    reservas.splice(w1,1)
                  }
                }
                dia = {
                  int: parseInt(dia_next_reserva),
                  events: eventos
                }
                dias.push(dia);
                eventos = []; 
              }
            }


            for(var z = 0; z < reservas.length; z++){
              fecha_next_reserva = reservas[z].dia_user;
              ano_next_reserva = fecha_next_reserva.slice(0,4);
              mes_next_reserva = (fecha_next_reserva.slice(0,7)).slice(-2);
              dia_next_reserva = fecha_next_reserva.slice(-2);
              if(ano_next_reserva === ano_reserva){

                hora_reserva = reservas[z].hora_user;
                id_reserva = reservas[z].id_cliente;
                hora_int_siguiente = parseInt(hora_reserva.slice(0, -2)) + 1;
                hora_siguiente_reserva = hora_int_siguiente.toString();
                AM_o_PM = hora_reserva.slice(-2);

                evento = {
                  startTime: hora_reserva,
                  endTime: hora_siguiente_reserva,
                  mTime: AM_o_PM,
                  text: id_reserva
                }
                eventos.push(evento)
                reservas.splice(z,1)

                for(var z1 = 0; z1 < reservas.length; z1++){
                  fecha_next_next_reserva = reservas[z1].dia_user;
                  ano_next_next_reserva = fecha_next_next_reserva.slice(0,4);
                  mes_next_next_reserva = (fecha_next_next_reserva.slice(0,7)).slice(-2);
                  dia_next_next_reserva = fecha_next_next_reserva.slice(-2);
                  if(ano_next_next_reserva === ano_next_reserva && mes_next_next_reserva === mes_next_reserva){

                    hora_reserva = reservas[z1].hora_user;
                    id_reserva = reservas[z1].id_cliente;
                    hora_int_siguiente = parseInt(hora_reserva.slice(0, -2)) + 1;
                    hora_siguiente_reserva = hora_int_siguiente.toString();
                    AM_o_PM = hora_reserva.slice(-2);

                    evento = {
                      startTime: hora_reserva,
                      endTime: hora_siguiente_reserva,
                      mTime: AM_o_PM,
                      text: id_reserva
                    }
                    eventos.push(evento)
                    reservas.splice(z1,1)       

                    for(var z2 = 0; z2 < reservas.length; z2++){
                      fecha_next_next_next_reserva = reservas[z2].dia_user;
                      ano_next_next_next_reserva = fecha_next_next_next_reserva.slice(0,4);
                      mes_next_next_next_reserva = (fecha_next_next_next_reserva.slice(0,7)).slice(-2);
                      dia_next_next_next_reserva = fecha_next_next_next_reserva.slice(-2);

                      if(ano_next_next_next_reserva === ano_next_next_reserva && mes_next_next_next_reserva === mes_next_next_reserva && 
                        dia_next_next_next_reserva === dia_next_next_reserva){

                        hora_reserva = reservas[z2].hora_user;
                        id_reserva = reservas[z2].id_cliente;
                        hora_int_siguiente = parseInt(hora_reserva.slice(0, -2)) + 1;
                        hora_siguiente_reserva = hora_int_siguiente.toString();
                        AM_o_PM = hora_reserva.slice(-2);

                        evento = {
                          startTime: hora_reserva,
                          endTime: hora_siguiente_reserva,
                          mTime: AM_o_PM,
                          text: id_reserva
                        }
                        eventos.push(evento)
                        reservas.splice(z2,1)
                      }
                    }
                    dia = {
                      int: parseInt(dia_next_next_reserva),
                      events: eventos
                    }
                    dias.push(dia);
                    eventos = []; 
                  }
                }
                mes = {
                  int: parseInt(mes_next_reserva),
                  days: dias
                }
                meses.push(mes)
                dias = []
              }
            }
            ano = {
              int: parseInt(ano_next_reserva),
              months: meses
            }
            anos.push(ano)
            meses = []
          }
        }else{
          // cuando no hay reservas
        }
        
        data  = {
          years: anos
        }
      }
    );


    await sleep(1000);
    data = fixed_data(data);

    return JSON.stringify(data)
  }

  function fixed_data(data){
    var data_fixed = null

    anos = data.years
    for(var i = 0; i < anos.length; i++){
      ano = anos[i]
      num_ano = anos[i].int
      meses = anos[i].months

      for(var i2 = 0; i2 < meses.length; i2++){
        mes = meses[i2]
        num_mes = meses[i2].int
        dias = meses[i2].days

        for(var i3 = 0; i3 < dias.length; i3++){
          dia = dias[i3]
          num_dia = dia.int
          events_dia = dia.events
          // I3_2
          for(var i3_2 = i3+1; i3_2 < dias.length; i3_2++){
            dia_var = dias[i3_2]
            num_dia_var = dia_var.int
            events_dia_var = dia_var.events
            if(num_dia === num_dia_var){
              dia = {
                int: num_dia,
                events: events_dia.concat(events_dia_var)
              }
              dias.splice(i3_2,1)
            }
          }
          dias[i3] = dia
        }

        for(var i2_2 = i2 +1; i2_2 < meses.length; i2_2++){
          dias_var = meses[i2_2].days
          num_mes_var = meses[i2_2].int
          if(num_mes === num_mes_var){
            mes = {
              int: num_mes,
              days: dias.concat(dias_var)
            }
            meses.splice(i2_2,1)
          }
        } 

        meses[i2] = mes

      }

      for(var i_2 = i+1; i_2 < anos.length; i_2++){
        num_ano_var = anos[i_2].int
        meses_var = anos[i_2].months
        if(num_ano_var === num_ano){
          ano = {
            int: num_ano,
            months: meses.concat(meses_var)
          }
          anos.splice(i_2,1)
        }
      }

      anos[i] = ano

    }

    data_fixed = {
      years: anos
    }

    return data_fixed

  }

  router.get('/gestionReservas', checkNotAuthenticatedAdmin,async (req, res) => {
    res.render('./vistasAdmin/gestionReservas', { title: 'Reservas', user: req.user, dates: await getDates()});
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
    const {dia_user, hora_user, id_cliente} = req.body;
    console.log({
     dia_user, hora_user, id_cliente
    });
    let errors =[];
     
    AM_or_PM = hora_user.slice(-2)
    hora_int_siguiente = parseInt(hora_user.slice(0, -2)) + 1;
    if(hora_int_siguiente === 12){
      hora_siguiente_user = hora_int_siguiente.toString() + "PM";
    } else{
      hora_siguiente_user = hora_int_siguiente.toString() + AM_or_PM;
    }

    if(!dia_user || !hora_user){
      errors.push({text:'Por favor llenar todos los campos obligatorios'});
    }

    var moment = require('moment');
    if( moment(dia_user).isBetween( moment('2000-01-01'), moment() ) ){
        errors.push({text: 'La fecha es incorrecta'});
    }
  
    if(errors.length > 0){
      res.render('./vistasCliente/cliente', { user: req.user.nombres_cliente, title: 'Cliente Principal', errors});
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
        
        let reservas_cliente = results.rows.length;
        if(reservas_cliente > 3){
          errors.push({text: 'Ya hay 4 reservas para esta hora y fecha'});          
          res.render('./vistasCliente/cliente', { user: req.user.nombres_cliente, title: 'Cliente Principal', errors});
        }
        else{
          client.query(
            `INSERT INTO reserva (dia_user, hora_user, id_cliente) VALUES ($1, $2, $3)`, 
            [dia_user, hora_user, id_cliente],
            (err, results) => {
              if (err) {
                throw err;
              }

              console.log(results.rows);
              req.flash("success_msg", "Se ha reservado exitosamente");
              res.redirect('/cliente');

              //Enviar corre0
              //Requerimos el paquete
              var nodemailer = require('nodemailer');

              //Creamos el objeto de transporte
              var transporter = nodemailer.createTransport({
              host: "smtp.gmail.com",
              post: "465",
              auth: {
              user: 'saborsazzon@gmail.com',
              pass: 'S@borS@zzon01'
               }
              });
              var mensaje = "Hola! En nuestro restaurante Sabor Sazzon tienes una reserva con los siguientes datos: "+"\n"+ "Fecha: "+ dia_user + "\n" + "Hora: " + hora_user +"\n" + "Lo esperamos a la hora y fecha indicada para tener el gusto de atenderlo." ;
              var mailOptions = {
                from: 'saborsazzon@gmail.com',
                to: id_cliente,
                subject: 'Reserva Sabor Sazzon',
                text: mensaje
              };
              
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email enviado: ' + info.response);
                }
              });
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


  router.post('/addEmployeeModal',async (req, res) => {
      let{correo_empleado, nombres_empleado, materno_empleado, paterno_empleado, rol_empleado} = req.body;

      let contrasena_empleado = nombres_empleado.trim() + paterno_empleado + materno_empleado;
      let contrasena_empleado2 = nombres_empleado.trim() + paterno_empleado + materno_empleado;

      let apodo_empleado = nombres_empleado.trim() + paterno_empleado.slice(0,1) + paterno_empleado.slice(-1) +
      contrasena_empleado.slice(0,1) + contrasena_empleado.slice(-1);
      
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

  router.post("/editEmployeeModal", async (req, res) => {
    
    let{correo_EditEmployee, nombres_EditEmployee, materno_EditEmployee, paterno_EditEmployee, rol_EditEmployee} = req.body;

    client.connect()
    client.query(
      `SELECT * FROM administrador
        WHERE correo_administrador = $1`,
      [correo_EditEmployee],
      (err, results) => {
        if (err) {
          throw err;
        }
        if(results.rows.length > 0){

          nombreAdmin = results.rows[0].nombre_administrador;
          paternoAdmin = results.rows[0].paterno_administrador;
          maternoAdmin = results.rows[0].materno_administrador;
          hashedContrasenaAdmin = results.rows[0].contraseña_administrador;
          apodoAdmin = results.rows[0].apodo_administrador;
          rolAdmin = 1

          if(nombres_EditEmployee === ''){
            nombres_EditEmployee = nombreAdmin;
          }
          if(materno_EditEmployee === ''){
            materno_EditEmployee = maternoAdmin;
          }
          if(paterno_EditEmployee === ''){
            paterno_EditEmployee = paternoAdmin
          }

          if(rol_EditEmployee === 2){
            client.query(
              `DELETE FROM administrador WHERE correo_administrador = $1`, 
              [correo_EditEmployee],
              (err, results) => {
                if (err) {
                  throw err;
                }
                client.query(
                  `INSERT INTO mesero VALUES ($1, $2, $3, $4, $5, $6)
                  RETURNING correo_mesero`, 
                  [correo_EditEmployee, hashedContrasenaAdmin, apodoAdmin, nombres_EditEmployee, paterno_EditEmployee, materno_EditEmployee],
                  (err, results) => {
                    if (err) {
                      throw err;
                    }
                    console.log(results.rows);
                    req.flash("success_msg", "Se ha modificado el empleado exitosamente");
                    res.redirect('/gestionEmpleados');
                  }
                );
              }
            );
          } else {
            client.query(
              `UPDATE administrador SET nombres_administrador = $1, paterno_administrador = $2, materno_administrador = $3 
              WHERE correo_administrador = $4`, 
              [nombres_EditEmployee, paterno_EditEmployee, materno_EditEmployee, correo_EditEmployee],
              (err, results) => {
                if (err) {
                  throw err;
                }
                console.log(results.rows);
                req.flash("success_msg", "Se ha modificado el empleado exitosamente");
                res.redirect('/gestionEmpleados');
              }
            );
          }
        }
      }
    );


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