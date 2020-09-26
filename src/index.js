const express = require('express');
const morgan = require('morgan');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;


// settings

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middlewares
app.use(morgan('dev'));

// routes
app.use(require('./routes/appRoutes'));

// static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'models')));

// listening the Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));