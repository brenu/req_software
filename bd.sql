-- Database generated with pgModeler (PostgreSQL Database Modeler).
-- pgModeler version: 0.9.4
-- PostgreSQL version: 13.0
-- Project Site: pgmodeler.io
-- Model Author: ---

-- Database creation must be performed outside a multi lined SQL file. 
-- These commands were put in this file only as a convenience.
-- 
-- object: projeto_eng | type: DATABASE --
-- DROP DATABASE IF EXISTS projeto_eng;
CREATE DATABASE projeto_eng;
-- ddl-end --


-- object: req_software | type: SCHEMA --
-- DROP SCHEMA IF EXISTS req_software CASCADE;
CREATE SCHEMA req_software;
-- ddl-end --
ALTER SCHEMA req_software OWNER TO postgres;
-- ddl-end --

SET search_path TO pg_catalog,public,req_software;
-- ddl-end --

-- object: public.usuarios | type: TABLE --
-- DROP TABLE IF EXISTS public.usuarios CASCADE;
CREATE TABLE public.usuarios (
	id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ,
	username varchar(50),
	senha varchar(200),
	email varchar(200),
	forgot_token varchar(50),
	CONSTRAINT usuarios_pk PRIMARY KEY (id),
	CONSTRAINT username_unique_constraint UNIQUE (username),
	CONSTRAINT email_unique_constraint UNIQUE (email)
);
-- ddl-end --
ALTER TABLE public.usuarios OWNER TO postgres;
-- ddl-end --

-- object: public.requisitos_de_usuario | type: TABLE --
-- DROP TABLE IF EXISTS public.requisitos_de_usuario CASCADE;
CREATE TABLE public.requisitos_de_usuario (
	id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ,
	id_usuario bigint,
	descritivo text,
	CONSTRAINT requisitos_de_usuario_pk PRIMARY KEY (id)
);
-- ddl-end --
ALTER TABLE public.requisitos_de_usuario OWNER TO postgres;
-- ddl-end --

-- object: public.requisitos_funcionais | type: TABLE --
-- DROP TABLE IF EXISTS public.requisitos_funcionais CASCADE;
CREATE TABLE public.requisitos_funcionais (
	id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ,
	id_requisito_usuario bigint,
	CONSTRAINT requisitos_funcionais_pk PRIMARY KEY (id)
);
-- ddl-end --
ALTER TABLE public.requisitos_funcionais OWNER TO postgres;
-- ddl-end --

-- object: public.requisitos_de_crud | type: TABLE --
-- DROP TABLE IF EXISTS public.requisitos_de_crud CASCADE;
CREATE TABLE public.requisitos_de_crud (
	id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ,
	id_requisito_funcional bigint,
	tipo varchar(10),
	CONSTRAINT requisitos_de_crud_pk PRIMARY KEY (id)
);
-- ddl-end --
ALTER TABLE public.requisitos_de_crud OWNER TO postgres;
-- ddl-end --

-- object: public.requisitos_de_processamento | type: TABLE --
-- DROP TABLE IF EXISTS public.requisitos_de_processamento CASCADE;
CREATE TABLE public.requisitos_de_processamento (
	id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ,
	id_requisito_funcional bigint,
	CONSTRAINT requisitos_de_processamento_pk PRIMARY KEY (id)
);
-- ddl-end --
ALTER TABLE public.requisitos_de_processamento OWNER TO postgres;
-- ddl-end --

-- object: fk_constraint_id_usuario_req_usuario | type: CONSTRAINT --
-- ALTER TABLE public.requisitos_de_usuario DROP CONSTRAINT IF EXISTS fk_constraint_id_usuario_req_usuario CASCADE;
ALTER TABLE public.requisitos_de_usuario ADD CONSTRAINT fk_constraint_id_usuario_req_usuario FOREIGN KEY (id_usuario)
REFERENCES public.usuarios (id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: fk_requisito_funcional_requisitos_de_usuario | type: CONSTRAINT --
-- ALTER TABLE public.requisitos_funcionais DROP CONSTRAINT IF EXISTS fk_requisito_funcional_requisitos_de_usuario CASCADE;
ALTER TABLE public.requisitos_funcionais ADD CONSTRAINT fk_requisito_funcional_requisitos_de_usuario FOREIGN KEY (id_requisito_usuario)
REFERENCES public.requisitos_de_usuario (id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: fk_requisito_de_crud_requisitos_funcionais | type: CONSTRAINT --
-- ALTER TABLE public.requisitos_de_crud DROP CONSTRAINT IF EXISTS fk_requisito_de_crud_requisitos_funcionais CASCADE;
ALTER TABLE public.requisitos_de_crud ADD CONSTRAINT fk_requisito_de_crud_requisitos_funcionais FOREIGN KEY (id_requisito_funcional)
REFERENCES public.requisitos_funcionais (id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: fk_requisito_de_processamento_requisitos_funcionais | type: CONSTRAINT --
-- ALTER TABLE public.requisitos_de_processamento DROP CONSTRAINT IF EXISTS fk_requisito_de_processamento_requisitos_funcionais CASCADE;
ALTER TABLE public.requisitos_de_processamento ADD CONSTRAINT fk_requisito_de_processamento_requisitos_funcionais FOREIGN KEY (id_requisito_funcional)
REFERENCES public.requisitos_funcionais (id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --


