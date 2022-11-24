const bd = require("../config/bd");

class AvaliacoesController {
    static async create(req, res) {
        const { id_projeto } = req.params;
        const { questao } = req.body;

        await bd.query("INSERT INTO questoes_avaliacao_projeto (id_projeto, questao, resposta) VALUES ($1, $2, '')", [id_projeto, questao]);

        return res.redirect("/avaliacao/"+id_projeto);
    }

    static async update(req, res) {
        const { id_projeto } = req.params;
        
        try {
            Object.keys(req.body).forEach(async key => {
                await bd.query("UPDATE questoes_avaliacao_projeto SET resposta = $1 WHERE id = $2", [req.body[key], key]);
            });
    
            return res.redirect("/avaliacao/"+id_projeto);
        } catch (error) {
            return res.render("pages/404");
        }        
    }

    static async delete(req, res) {
        const { id, id_projeto } = req.params;

        try {
            await bd.query(`
                DELETE FROM questoes_avaliacao_projeto WHERE id = $1 and id_projeto = $2
            `, [id, id_projeto]);

            return res.redirect("/avaliacao/"+id_projeto);
        } catch (error) {
            return res.render("pages/404");
        }
    }
}

module.exports = AvaliacoesController;