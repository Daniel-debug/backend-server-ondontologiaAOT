// Requires
var express = require('express');
var app = express();

var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');
var fs = require('fs');
var fileUpload = require('express-fileupload');
// default options
app.use(fileUpload());


app.put('/:tipo/:id', (req, res, next) => {

    var tipo = req.params.tipo;
    var id = req.params.id;

    //tipos de coleccion
    var tipoValidos = ['hospitales', 'medicos', 'usuarios'];
    if (tipoValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Tipo de coleccion no es valida',
            errors: { message: 'Tipo de coleccion no es valida' }
        });
    }
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No selecciono nada',
            errors: { message: 'Debe de seleccionar una imagen' }
        });
    }

    //Obtener nombre del archivo
    var archivo = req.files.imagen;
    var nombreCortado = archivo.name.split('.');
    var extensionArchivo = nombreCortado[nombreCortado.length - 1];

    // solo estas extensiones aceptamos
    var extensionesValidas = ['png', 'jpg', 'gif', 'jpge', 'png'];
    if (extensionesValidas.indexOf(extensionArchivo.toLowerCase()) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Extension no valida',
            errors: { message: 'Las extensiones validas son ' + extensionesValidas.join(', ') }
        });
    }
    // Nombre de archivo personalizado
    var nombreArchivo = `${id}-${new Date().getMilliseconds() }.${extensionArchivo}`;
    // Mover el archivo del temporal a un path
    var path = `./uploads/${tipo}/${nombreArchivo}`;

    archivo.mv(path, err => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover el archivo',
                errors: err
            });
        }
        subirPorTipo(tipo, id, nombreArchivo, res)
            // res.status(200).json({
            //     ok: true,
            //     mensaje: 'Archivo movido'
            // });

    })

});


function subirPorTipo(tipo, id, nombreArchivo, res) {
    if (tipo === 'usuarios') {
        Usuario.findById(id, (err, usuario) => {
            if (!usuario) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Usuario no existe',
                    errors: { message: 'Usuario no existe' }
                });
            }
            var pathViejo = './uploads/usuarios/' + usuario.img;
            // si existe, elimina la imagen anterior
            if (fs.existsSync(pathViejo)) {
                fs.unlinkSync(pathViejo, err); // Ojo usar SYNC 
            }
            usuario.img = nombreArchivo;
            usuario.save((err, usaurioActualizado) => {
                usaurioActualizado.password = ':)';
                res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de usaurio actualizada',
                    usuario: usaurioActualizado
                });
            });
        });
    }
    if (tipo === 'medicos') {
        Medico.findById(id, (err, medico) => {

            if (!medico) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'medico no existe',
                    errors: { message: 'medico no existe' }
                });
            }

            var pathViejo = './uploads/medicos/' + medico.img;
            // si existe, elimina la imagen anterior
            if (fs.existsSync(pathViejo)) {
                fs.unlinkSync(pathViejo, err); // Ojo usar SYNC 
            }
            medico.img = nombreArchivo;
            medico.save((err, medicoActualizado) => {
                medicoActualizado.password = ':)';
                res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de medico actualizada',
                    medico: medicoActualizado
                });
            });
        });
    }
    if (tipo === 'hospitales') {
        Hospital.findById(id, (err, hospital) => {
            if (!hospital) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'hospital no existe',
                    errors: { message: 'hospital no existe' }
                });
            }

            var pathViejo = './uploads/hospitales/' + hospital.img;
            // si existe, elimina la imagen anterior
            if (fs.existsSync(pathViejo)) {
                fs.unlinkSync(pathViejo, err); // Ojo usar SYNC 
            }
            hospital.img = nombreArchivo;
            hospital.save((err, hospitalActualizado) => {
                hospitalActualizado.password = ':)';
                res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de hospital actualizada',
                    hospital: hospitalActualizado
                });
            });
        });
    }
}



module.exports = app;