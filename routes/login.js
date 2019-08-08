var express = require("express");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var SEED = require("../config/config").SEED;
var app = express();
var Usuario = require("../models/usuario");

// Librerias de google
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(CLIENT_ID);
var CLIENT_ID = require("../config/config").CLIENT_ID;
// =======================================
// Autenticacion de google
// =======================================

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID
    });
    const payload = ticket.getPayload();
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    };
}
verify().catch(console.error);

app.post("/google", async(req, res) => {
    var token = req.body.token;
    try {
        var googleUser = await verify(token);
    } catch (e) {
        return res.status(403).json({
            ok: false,
            mensaje: "Token no valido"
        });
    }

    Usuario.findOne({ email: googleUser.email }, (err, UsuarioDB) => {
        if (err)
            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar usuario . login",
                errors: err
            });
        if (UsuarioDB) {
            if (UsuarioDB.google === false) {
                return res.status(400).json({
                    ok: false,
                    mensaje: "Debe de usar su autenticacion normal"
                });
            } else {
                UsuarioDB.password = ':)'
                var token = jwt.sign({ usuario: UsuarioDB }, SEED, {
                    expiresIn: 14400
                }); // 4 horas 
                res.status(201).json({
                    ok: true,
                    usuario: UsuarioDB,
                    token: token,
                    id: UsuarioDB._id,
                    menu: obtenerMenu(UsuarioDB.role)
                });
            }
        } else {
            //El usuario no existe... hay que crearlo
            var usuario = new Usuario();

            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ":)";

            usuario.save((err, usuarioDB) => {
                if (err) {
                    return res.status(500).json({
                        ok: true,
                        mensaje: "Error al crear usuario - google",
                        errors: err
                    });
                }

                var token = jwt.sign({ usuario: usuarioDB }, SEED, {
                    expiresIn: 14400
                }); // 4 horas
                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id,
                    menu: obtenerMenu(usuarioDB.role)
                });
            });
        }
    });
    // return res.status(200).json({
    //     ok: true,
    //     mensaje: "OK!!!",
    //     googleUser: googleUser
    // });
});

/// =======================================
//  Esta es la autenticacion normal
// =======================================
app.post("/", (req, res) => {
    var body = req.body;

    Usuario.findOne({ email: body.email }, (err, UsuarioDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: "Error al buscar usuarios",
                errors: err
            });
        }
        if (!UsuarioDB) {
            return res.status(400).json({
                ok: true,
                mensaje: "Credenciales incorrectas - email",
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, UsuarioDB.password)) {
            //compareSync
            return res.status(400).json({
                ok: false,
                mensaje: "credenciales incorrectas -password",
                errors: err
            });
        }

        // crear un token!!!
        UsuarioDB.password = ":)";
        var token = jwt.sign({ usuario: UsuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas
        res.status(201).json({
            ok: true,
            usuario: UsuarioDB,
            token: token,
            id: UsuarioDB._id,
            menu: obtenerMenu(UsuarioDB.role)
        });
    });
});


function obtenerMenu(ROLE) {
    menu = [{
        titulo: 'principal',
        icono: 'mdi mdi-gauge',
        submenu: [
            { titulo: 'Dashboard', url: '/dashboard' },
            { titulo: 'ProgressBar', url: '/progress' },
            { titulo: 'Graficas', url: '/graficas1' },
            { titulo: 'promesas', url: '/promesas' },
            { titulo: 'observable', url: '/rxjs' }
        ]
    }, {
        titulo: 'Mantenimientos',
        icono: 'mdi mdi-folder-lock-open',
        submenu: [
            //{titulo: 'Usuarios', url: '/usuarios'},
            { titulo: 'Hospitales', url: '/hospitales' },
            { titulo: 'Médicos', url: '/medicos' }
        ]
    }];

    if (ROLE === 'ADMIN_ROLE') {
        menu[1].submenu.unshift({ titulo: 'Usuarios', url: '/usuarios' })
    }
    return menu;
}

module.exports = app;