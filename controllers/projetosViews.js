const bd = require('../config/bd');

class ProjetosViewsController {
    static async index(req, res) {

        const projetos = (await bd.query(`
            SELECT 
                id,
                nome_projeto AS nome,
                descricao
            FROM projetos
            WHERE id_usuario = $1
        `, [req.session.user.id])).rows;

        return res.render('pages/projetos', {
            projetos: projetos
        });
    }

    static async create(req, res) {
        return res.render('pages/projeto_form', {
            erro: ""
        });
    }
}

module.exports = ProjetosViewsController;