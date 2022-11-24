const bd = require('../config/bd');

class ProjetosController {
    static async create(req, res) {
        const {nome, descricao} = req.body;

        console.log(req.body);

        const id_projeto = (await bd.query("INSERT INTO projetos (id_usuario, nome_projeto, descricao) VALUES ($1, $2, $3) RETURNING id", [req.session.user.id, nome, descricao])).rows[0].id;

        return res.redirect(`/requirements/${id_projeto}`);
    }
}

module.exports = ProjetosController;