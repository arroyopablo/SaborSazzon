const pgp = require("pg-promise");
const db = pgp("postgres://ukgerkfqbjoyxb:2e4f52321c055f56a6880dd07d259a0cf228d474ff18bcb0e66a700f357c5c65@ec2-54-86-57-171.compute-1.amazonaws.com:5432/dcep7v2k1ggvsr");

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

