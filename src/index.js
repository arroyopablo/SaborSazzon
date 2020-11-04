const express = require('express');
const morgan = require('morgan');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http').Server(app);
const io = require('socket.io')(http);
  
  // Run when client connects
io.on('connection', (socket) => {
    console.log('Usuario conectado')
    socket.emit('bienvenida')
    socket.on('nuevo_mensaje', (message) => {
      // Dinfundimos el mensaje a todos los clientes
      io.sockets.emit('difundir_mensaje', message)
    })
  });


// settings

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middlewares
app.use(morgan('dev'));

// routes
app.use(require('./routes'));

// static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'models')));
app.use(express.static(__dirname + 'views'))

// listening the Server
var server = http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});