const express = require('express');
const cookieParser = require('cookie-parser');
const bd = require('./config/bd');
const session = require('./config/session');
const app = express();
const crypto = require('crypto');
const Requisito = require('./models/requisito');

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session);

const authMiddleware = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    return res.redirect("/login");
  }
};

app.get('/', function(req, res) {
  if (req.session.user) {{
    return res.redirect("/edit-user");
  }}

  return res.redirect("/login");
});

app.get('/login', function(req, res) {
  res.render('pages/login', {erro: ""});
});

app.post('/login', async (req, res) => {
  let { username, senha } = req.body;

  try {
    senha = crypto.pbkdf2Sync(senha, process.env.SESSIONS_SECRET, 1000, 64, 'sha512').toString('hex');

    const result = await bd.query("SELECT id, senha, email FROM usuarios WHERE username = $1", [username]);
    const {id, senha: hashRegistrada, email} = result.rows[0];

    if (senha !== hashRegistrada) {
      return res.render('pages/login', {
        erro: "usuário ou senha incorretos"
      });
    }

    req.session.user = {id, username, email};
    return res.redirect("/edit-user");
  } catch (error) {
    return res.render('pages/login', {
      erro: "usuário ou senha incorretos"
    });
  }
});

app.get('/register', function(req, res) {
  res.render('pages/user_form', {
    type: "register",
    erro: "",
  });
});

app.post('/register', async (req, res) => {
  let { username, senha, email } = req.body;

  try {
    senha = crypto.pbkdf2Sync(senha, process.env.SESSIONS_SECRET, 1000, 64, 'sha512').toString('hex');

    const result = await bd.query("INSERT INTO usuarios (username, senha, email) VALUES ($1, $2, $3) RETURNING id", [username, senha, email]);
    const id = result.rows[0].id;

    req.session.user = {id, username, email};

    return res.redirect("/edit-user");
  } catch (error) {
    return res.render('pages/user_form', {
      type: "register",
      username,
      senha,
      email,
      erro: "revise os campos e tente novamente"
    });
  }
});

app.get('/edit-user', authMiddleware, function(req, res) {
  res.render('pages/user_form', {
    type: "edit",
    username: req.session.user.username,
    senha: req.session.user.senha,
    email: req.session.user.email,
    erro: "",
  });
});

app.post('/edit-user', authMiddleware, async (req, res) => {
  let { username, senha, email } = req.body;

  try {
    let query = "UPDATE usuarios SET ";
    let parameters = [];
    
    if (username) {
      parameters.push(username);
      query += `username = $${parameters.length}`;
    }

    if (senha) {
      senha = crypto.pbkdf2Sync(senha, process.env.SESSIONS_SECRET, 1000, 64, 'sha512').toString('hex');
      parameters.push(senha);
      query += `${parameters.length > 1 ? "," : ""} senha = $${parameters.length}`;
    }

    if (email) {
      parameters.push(email);
      query += `${parameters.length > 1 ? "," : ""} email = $${parameters.length}`;
    }

    parameters.push(req.session.user.id);
    query += ` WHERE id = $${parameters.length}`

    await bd.query(query, parameters);

    req.session.user.username = username ? username : req.session.user.email;
    req.session.user.email = email ? email : req.session.user.email;

    return res.redirect("/edit-user");
  } catch (error) {
    return res.render('pages/user_form', {
      type: "edit",
      username,
      senha,
      email,
      erro: "revise os campos e tente novamente"
    });
  }
});

app.get("/requirements", authMiddleware, async (req, res) => {
  const requisitosDeCRUD = (await bd.query(`
    SELECT 
      requisitos_de_usuario.descritivo,
      requisitos_de_usuario.id_usuario,
      requisitos_de_usuario.id AS id_requisito_usuario,
      'crud' AS tipo,
      entidades.nome AS entidade
    FROM requisitos_de_usuario
    INNER JOIN requisitos_funcionais ON requisitos_de_usuario.id = requisitos_funcionais.id_requisito_usuario
    INNER JOIN requisitos_de_crud ON requisitos_funcionais.id = requisitos_de_crud.id_requisito_funcional
    INNER JOIN entidades ON entidades.id_requisito_de_crud = requisitos_de_crud.id
    WHERE requisitos_de_usuario.id_usuario = $1
  `, [req.session.user.id])).rows;

  const requisitosDeProcessamento = (await bd.query(`
    SELECT 
      requisitos_de_usuario.descritivo,
      requisitos_de_usuario.id_usuario,
      requisitos_de_usuario.id AS id_requisito_usuario,
      'processamento' AS tipo,
      'N/A' AS entidade
    FROM requisitos_de_usuario
    INNER JOIN requisitos_funcionais ON requisitos_de_usuario.id = requisitos_funcionais.id_requisito_usuario
    INNER JOIN requisitos_de_processamento ON requisitos_funcionais.id = requisitos_de_processamento.id_requisito_funcional
    WHERE requisitos_de_usuario.id_usuario = $1
  `, [req.session.user.id])).rows;
  
  return res.render('pages/requirements', {
    requisitos: [...requisitosDeCRUD, ...requisitosDeProcessamento],
  });
});

app.get("/requirements/create", authMiddleware, async (req, res) => {
  return res.render('pages/requirement_form', {
    type: "create",
    erro: "",
  });
});
app.post("/requirements/create", authMiddleware, async (req, res) => {
  const { texto } = req.body;

  try {
    const requisito = new Requisito(texto);

    const id_requisito_de_usuario = (await bd.query(
      "INSERT INTO requisitos_de_usuario (id_usuario, descritivo) VALUES ($1, $2) RETURNING id",
      [req.session.user.id, requisito.texto]
    )).rows[0].id;

    const id_requisito_funcional = (await bd.query(
      "INSERT INTO requisitos_funcionais (id_requisito_usuario) VALUES ($1) RETURNING id",
      [id_requisito_de_usuario]
    )).rows[0].id;
  
    if (requisito.tipo_requisito === "crud") {
      const id_requisito_de_crud = (await bd.query(
        "INSERT INTO requisitos_de_crud (id_requisito_funcional, tipo) VALUES ($1, $2) RETURNING id",
        [id_requisito_funcional, requisito.tipo]
      )).rows[0].id;

      const id_entidade = (await bd.query(
        "INSERT INTO entidades (id_requisito_de_crud, nome) VALUES ($1, $2) RETURNING id",
        [id_requisito_de_crud, requisito.entidade]
      )).rows[0].id;

      for (let atributo of requisito.atributos) {
        await bd.query(
          "INSERT INTO atributos (id_entidade, nome, tipo, tamanho) VALUES ($1, $2, $3, $4) RETURNING id",
          [id_entidade, atributo, "varchar", "255"]
        );
      }
    } else {
      await bd.query(
        "INSERT INTO requisitos_de_processamento (id_requisito_funcional) VALUES ($1)",
        [id_requisito_funcional]
      );
    }

    return res.redirect("/requirements");
  } catch (error) {
    if (typeof error === "string") {
      return res.render('pages/requirement_form', {
        type: "create",
        erro: error,
      });
    }

    console.log(error);
    return res.render('pages/requirement_form', {
      type: "create",
      erro: "Houve um erro no processo, revise a estrutura do requisito inserido!",
    });
  }
});

app.get("/requirements/edit/:id", authMiddleware, async (req, res) => {
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

});

app.post("/requirements/edit/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { texto } = req.body;

  try {
    const id_requisito = (await bd.query("SELECT id FROM requisitos_de_usuario WHERE id  = $1 AND id_usuario = $2", [id, req.session.user.id])).rows[0].id;

    if (id_requisito) {
      await bd.query("DELETE FROM requisitos_funcionais WHERE id_requisito_usuario = $1", [id_requisito]);

      const requisito = new Requisito(texto);

      await bd.query("UPDATE requisitos_de_usuario SET descritivo = $1 WHERE id = $2", [requisito.texto, id_requisito]);

      const id_requisito_funcional = (await bd.query(
        "INSERT INTO requisitos_funcionais (id_requisito_usuario) VALUES ($1) RETURNING id",
        [id_requisito]
      )).rows[0].id;
    
      if (requisito.tipo_requisito === "crud") {
        const id_requisito_de_crud = (await bd.query(
          "INSERT INTO requisitos_de_crud (id_requisito_funcional, tipo) VALUES ($1, $2) RETURNING id",
          [id_requisito_funcional, requisito.tipo]
        )).rows[0].id;
  
        const id_entidade = (await bd.query(
          "INSERT INTO entidades (id_requisito_de_crud, nome) VALUES ($1, $2) RETURNING id",
          [id_requisito_de_crud, requisito.entidade]
        )).rows[0].id;
  
        for (let atributo of requisito.atributos) {
          await bd.query(
            "INSERT INTO atributos (id_entidade, nome, tipo, tamanho) VALUES ($1, $2, $3, $4) RETURNING id",
            [id_entidade, atributo, "varchar", "255"]
          );
        }
      }

      return res.redirect("/requirements");
    }

    return res.render("pages/404");
  } catch (error) {
    return res.render("pages/404");
  }
});

app.get("/requirements/delete/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    await bd.query("DELETE FROM requisitos_de_usuario WHERE id = $1 AND id_usuario = $2", [id, req.session.user.id]);

    return res.redirect("/requirements");
  } catch (error) {
    return res.render("pages/404");
  }

});

app.listen(8080);
console.log('Server is listening on port 8080');