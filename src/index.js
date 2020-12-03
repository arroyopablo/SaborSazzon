const express = require('express');
const morgan = require('morgan');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http').Server(app);
const io = require('socket.io')(http);
const formatMessage = require('./models/messages.js');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require('./models/users.js');  

const botName = 'SaborSazzon APP';

// Run when client connects
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, mesa }) => {
    const user = userJoin(socket.id, username, mesa);

    socket.join(user.mesa);

    // Welcome current user
    socket.emit('difundir_mensaje', formatMessage(botName, 'Bienvenido'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.mesa)
      .emit(
        'difundir_mensaje',
        formatMessage(botName, `${user.username} ha ingresado al Chat`)
      );
    
    // Send users and room info
    io.to(user.mesa).emit('roomUsers', {
      mesa: user.mesa,
      users: getRoomUsers(user.mesa),
    });    
  });

  socket.on('nuevo_mensaje', (message) => {
    const user = getCurrentUser(socket.id);
    // Dinfundimos el mensaje a todos los clientes
    io.to(user.mesa).emit('difundir_mensaje', formatMessage(user.username, message));
  })

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.mesa).emit(
        'difundir_mensaje',
        formatMessage(botName, `${user.username} ha abandonado el chat`)
      );

      // Send users and room info
      io.to(user.mesa).emit('roomUsers', {
        mesa: user.mesa,
        users: getRoomUsers(user.mesa),
      });
    }
  });
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