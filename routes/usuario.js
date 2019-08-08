// Requires
var express = require("express");
var app = express();
var bcrypt = require('bcryptjs'); // encriptador
var Usuario = require("../models/usuario");

var jwt = require('jsonwebtoken');
var mdAutenticacion = require('../middlewares/autenticacion');
// ================================================
// Obtener todos los usuarios
// ================================================
app.get("/", (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Usuario.find({}, "nombre email img role google")
        .skip(desde) // salta una seccion
        .limit(5) // maximo a partir de 0
        .exec((err, usuarios) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error cargando usuarios",
                    errors: err
                });
            }
            Usuario.count({}, (err, conteo) => { // funcion para contar los objectos
                res.status(200).json({
                    ok: true,
                    usuarios: usuarios,
                    total: conteo
                });
            })

        });
});









// ================================================
//  Actualizar usuario
// ================================================
app.put('/:id', [mdAutenticacion.verificaToken, mdAutenticacion.verificaADMIN_ROLE_O_MismoUsuario], (req, res) => {

    var id = req.params.id
    var body = req.body;
    Usuario.findById(id, (err, usuario) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al crear usuario",
                errors: err
            });
        }
        if (!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: "El usuario con el id" + id + 'no existe',
                errors: { message: 'No existe un usuario con ese ID' }
            });
        }

        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        usuario.save((err, usuarioGuardado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Error al actualizar usuario",
                    errors: err
                });
            }
            usuarioGuardado.password = ':)'
            res.status(200).json({
                ok: true,
                usuario: usuarioGuardado
            });
        });
    });
});



// ==========================================
// crea un nuevoa usuario
// ==========================================
app.post('/', (req, res) => {
    var body = req.body;

    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10), // encripta la contraseña
        img: body.img,
        role: body.role
    });

    usuario.save((err, usuarioGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: "Error al crear usuario",
                errors: err
            });
        }
        res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            usaurioToken: req.usuario // tiene que ser directo del request para que jale
        });
    });



});



// ================================================
// Borrar un usuario por el id
// ================================================

app.delete('/:id', [mdAutenticacion.verificaToken, mdAutenticacion.verificaADMIN_ROLE], (req, res) => {
    var id = req.params.id;
    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al borrar usuario",
                errors: err
            });
        }
        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: "No existe un usuario con ese id",
                errors: { message: 'No existe un usuario con ese id' }
            });
        }
        res.status(200).json({
            ok: true,
            usuario: usuarioBorrado
        });
    });
});

module.exports = app;