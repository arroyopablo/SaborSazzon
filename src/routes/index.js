const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', { title: 'Mande' });
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

module.exports = router;