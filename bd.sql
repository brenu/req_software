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


