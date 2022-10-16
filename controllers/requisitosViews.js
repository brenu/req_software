const bd = require('../config/bd');

class RequisitosViewsController {
    static async create(req, res) {
        return res.render('pages/requirement_form', {
            type: "create",
            erro: "",
          });
    }

    static async edit(req, res) {
        const { id } = req.params;

        try {
            const texto = (await bd.query("SELECT descritivo FROM requisitos_de_usuario WHERE id = $1 AND id_usuario = $2",
            [id, req.session.user.id])).rows[0].descritivo;

            if (texto) {
            return res.render('pages/requirement_form', {
                type: "edit",
                texto,
                erro: "",
            });
            }
        } catch (error) {
            return res.render("pages/404");
        }
    }
}

module.exports = RequisitosViewsController;