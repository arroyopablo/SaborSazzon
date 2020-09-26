const express = require('express');
const { client } = require('./dbConfig');
const bcrypt = require("bcrypt");
const router = express.Router();

function insertUser(user, correo_user,apodo_user,contraseña_user, nombres_user, paterno_user, materno_user){
    var apodo_user_val = null;
    apodo_user_val = apodo_user;
    
    db.query("INSERT INTO ", user," VALUES(",correo_user, "," , apodo_user_val,"," ,contraseña_user, "," , nombres_user, "," ,
    paterno_user, "," ,
    materno_user, ")", 
    (err, res) => {
        if (err){
            throw err
        }
    });
    
};


module.exports = insertUser;

