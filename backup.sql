--
-- PostgreSQL database dump
--

\restrict vKWKFCPL1Ye8ivFq11JnC6Q6vJqixpb3HeiiuDwzc8NiNEeXTcFMAvnChBe2ecn

-- Dumped from database version 16.13
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: accion_adaptativa; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.accion_adaptativa AS ENUM (
    'subir',
    'mantener',
    'bajar'
);


--
-- Name: estado_usuario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_usuario AS ENUM (
    'activo',
    'suspendido'
);


--
-- Name: nivel_dificultad; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.nivel_dificultad AS ENUM (
    'muy_facil',
    'facil',
    'normal',
    'dificil',
    'muy_dificil'
);


--
-- Name: rol_usuario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rol_usuario AS ENUM (
    'estudiante',
    'tutor',
    'padre',
    'admin'
);


--
-- Name: tipo_evaluacion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_evaluacion AS ENUM (
    'diagnostica_curso',
    'evaluacion_tema'
);


--
-- Name: tipo_pregunta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_pregunta AS ENUM (
    'diagnostica_curso',
    'evaluacion_tema'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cursos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cursos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL
);


--
-- Name: TABLE cursos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.cursos IS 'Áreas académicas: Matemática, Comunicación, Ciencia y Tecnología.';


--
-- Name: cursos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cursos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cursos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cursos_id_seq OWNED BY public.cursos.id;


--
-- Name: evaluaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluaciones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    tipo public.tipo_evaluacion NOT NULL,
    curso_id integer NOT NULL,
    tema_id integer,
    grado integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    finalizado_en timestamp with time zone,
    CONSTRAINT evaluaciones_grado_check CHECK (((grado >= 1) AND (grado <= 6)))
);


--
-- Name: COLUMN evaluaciones.finalizado_en; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.evaluaciones.finalizado_en IS 'Null mientras la evaluación está en curso; se setea al invocar finalize.';


--
-- Name: logros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logros (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(120) NOT NULL,
    descripcion text NOT NULL,
    criterio character varying(80) NOT NULL,
    icono_url text
);


--
-- Name: COLUMN logros.criterio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.logros.criterio IS 'Identificador legible del criterio (ej. examen_perfecto, racha_5). Usado en código para verificar desbloqueos.';


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: opciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opciones (
    id integer NOT NULL,
    pregunta_id integer NOT NULL,
    texto text NOT NULL,
    es_correcta boolean DEFAULT false NOT NULL
);


--
-- Name: opciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.opciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: opciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.opciones_id_seq OWNED BY public.opciones.id;


--
-- Name: preguntas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preguntas (
    id integer NOT NULL,
    enunciado text NOT NULL,
    tipo public.tipo_pregunta NOT NULL,
    curso_id integer,
    tema_id integer,
    dificultad public.nivel_dificultad DEFAULT 'normal'::public.nivel_dificultad NOT NULL,
    CONSTRAINT chk_preguntas_curso_o_tema CHECK ((((tipo = 'diagnostica_curso'::public.tipo_pregunta) AND (curso_id IS NOT NULL)) OR ((tipo = 'evaluacion_tema'::public.tipo_pregunta) AND (tema_id IS NOT NULL))))
);


--
-- Name: COLUMN preguntas.dificultad; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.preguntas.dificultad IS 'Usado por el motor adaptativo para seleccionar preguntas según el nivel actual del estudiante.';


--
-- Name: preguntas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preguntas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preguntas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.preguntas_id_seq OWNED BY public.preguntas.id;


--
-- Name: puntos_curso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.puntos_curso (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    usuario_id uuid NOT NULL,
    curso_id integer NOT NULL,
    puntos_total integer DEFAULT 0 NOT NULL,
    posicion integer,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE puntos_curso; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.puntos_curso IS 'Acumulado de puntos por usuario por curso. La posición se recalcula tras cada evaluación.';


--
-- Name: respuestas_evaluacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.respuestas_evaluacion (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    evaluacion_id uuid NOT NULL,
    pregunta_id integer NOT NULL,
    opcion_id integer NOT NULL,
    es_correcta boolean NOT NULL,
    tiempo_respuesta_seg integer
);


--
-- Name: resultados_evaluacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resultados_evaluacion (
    evaluacion_id uuid NOT NULL,
    nota integer NOT NULL,
    puntaje_logro integer DEFAULT 0 NOT NULL,
    num_aciertos integer DEFAULT 0 NOT NULL,
    num_errores integer DEFAULT 0 NOT NULL,
    num_aciertos_consecutivos integer DEFAULT 0 NOT NULL,
    num_errores_consecutivos integer DEFAULT 0 NOT NULL,
    tiempo_promedio_respuesta integer DEFAULT 0 NOT NULL,
    indice_desempeno numeric(4,3),
    dificultad_actual public.nivel_dificultad NOT NULL,
    accion_adaptativa public.accion_adaptativa NOT NULL,
    mensaje_adaptativo text,
    CONSTRAINT resultados_evaluacion_nota_check CHECK (((nota >= 0) AND (nota <= 100)))
);


--
-- Name: COLUMN resultados_evaluacion.indice_desempeno; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resultados_evaluacion.indice_desempeno IS 'Índice de Desempeño del Estudiante (ID) calculado por el algoritmo adaptativo. Rango 0.000 - 1.000.';


--
-- Name: COLUMN resultados_evaluacion.dificultad_actual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resultados_evaluacion.dificultad_actual IS 'Nivel de dificultad asignado al estudiante después de aplicar el motor adaptativo.';


--
-- Name: temas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temas (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    curso_id integer NOT NULL,
    grado integer NOT NULL,
    CONSTRAINT temas_grado_check CHECK (((grado >= 1) AND (grado <= 6)))
);


--
-- Name: TABLE temas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.temas IS 'Contenidos específicos asociados a un curso y un grado de primaria.';


--
-- Name: temas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.temas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: temas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.temas_id_seq OWNED BY public.temas.id;


--
-- Name: usuario_logros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario_logros (
    usuario_id uuid NOT NULL,
    logro_id uuid NOT NULL,
    obtenido_en timestamp with time zone DEFAULT now() NOT NULL,
    evaluacion_id uuid
);


--
-- Name: COLUMN usuario_logros.evaluacion_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuario_logros.evaluacion_id IS 'Evaluación que originó el desbloqueo del logro (cuando aplique).';


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(120) NOT NULL,
    codigo character varying(40) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol public.rol_usuario DEFAULT 'estudiante'::public.rol_usuario NOT NULL,
    estado public.estado_usuario DEFAULT 'activo'::public.estado_usuario NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.usuarios IS 'Usuarios del sistema. En MVP solo estudiantes; en Fase 2 se agregan tutores, padres y admin.';


--
-- Name: COLUMN usuarios.codigo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usuarios.codigo IS 'Identificador alfanumérico para login simple (ej. VAL001).';


--
-- Name: cursos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos ALTER COLUMN id SET DEFAULT nextval('public.cursos_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: opciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opciones ALTER COLUMN id SET DEFAULT nextval('public.opciones_id_seq'::regclass);


--
-- Name: preguntas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntas ALTER COLUMN id SET DEFAULT nextval('public.preguntas_id_seq'::regclass);


--
-- Name: temas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temas ALTER COLUMN id SET DEFAULT nextval('public.temas_id_seq'::regclass);


--
-- Data for Name: cursos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cursos (id, nombre) FROM stdin;
1	Matemática
5	Historia del Perú
\.


--
-- Data for Name: evaluaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluaciones (id, usuario_id, tipo, curso_id, tema_id, grado, creado_en, finalizado_en) FROM stdin;
6635083f-511d-4485-b1e6-036fa3bee758	a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	evaluacion_tema	1	1	4	2026-05-13 14:53:37.937581+00	2026-05-13 14:53:57.058+00
b1b0c121-c53a-4ceb-aee2-295fc2475469	599acc4f-badf-41d2-a87d-a336f82b0241	evaluacion_tema	1	1	4	2026-05-13 18:46:09.303582+00	2026-05-13 18:46:20.456+00
4f50ddf8-1831-4046-9487-67dd79bba1cf	599acc4f-badf-41d2-a87d-a336f82b0241	evaluacion_tema	1	1	4	2026-05-13 18:46:26.269107+00	2026-05-13 18:46:33.16+00
c6b7f6e0-81fc-413a-8504-81d1ce58d810	a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	evaluacion_tema	1	1	4	2026-05-13 22:29:56.299488+00	2026-05-13 22:30:13.536+00
d6fa57a5-f232-4b76-bed7-13009db1d664	599acc4f-badf-41d2-a87d-a336f82b0241	evaluacion_tema	1	1	4	2026-05-14 00:12:57.362092+00	2026-05-14 00:13:36.441+00
8605b2f4-647b-4ec9-9429-4ee2a44416f2	a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	evaluacion_tema	5	17	5	2026-06-11 23:22:26.490725+00	2026-06-11 23:22:44.193+00
63021aae-f845-4170-8ed9-3b15455f6fca	a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	evaluacion_tema	5	17	5	2026-06-11 23:22:50.415516+00	2026-06-11 23:23:00.718+00
09533b6c-1ede-495f-ba27-f26204e812a2	a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	evaluacion_tema	5	17	5	2026-06-11 23:23:11.175148+00	2026-06-11 23:23:20.494+00
35ee3bc4-71fa-4f62-ac2f-8d50bb6b12e2	a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	evaluacion_tema	5	17	5	2026-06-11 23:23:25.326283+00	2026-06-11 23:23:44.501+00
\.


--
-- Data for Name: logros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.logros (id, nombre, descripcion, criterio, icono_url) FROM stdin;
b14a49d9-e220-498c-bdbb-0cff10fc10a3	Iniciaste tu camino	Completaste tu primera evaluación.	primer_examen	\N
6087d740-f9d5-4cbd-aaa4-896cdf3ad4ab	Examen perfecto	Obtuviste todas las respuestas correctas en una evaluación.	examen_perfecto	\N
bdfa64c9-e139-4779-a299-ef3227069ead	Velocista	Completaste una evaluación con un tiempo promedio menor a 20 segundos por pregunta.	velocista	\N
db7a82d9-07d2-466e-a3ce-78d5d6875716	Racha de 5	Lograste 5 respuestas correctas seguidas en una evaluación.	racha_5	\N
05d47092-e762-4bb1-b3a8-4d68f2512661	Imparable	Lograste 10 respuestas correctas seguidas en una evaluación.	racha_10	\N
2e43ca14-d0df-478f-a4fe-82394d3e30a1	Nivel avanzado	Alcanzaste la dificultad 'difícil' en algún tema.	nivel_avanzado	\N
980d4d60-7893-4ac6-8c5d-fdbe1af454d1	Constancia	Completaste 5 evaluaciones en la plataforma.	constancia_5	\N
fb1e55ef-3f59-40de-a955-8379c519d7a5	Dedicado	Completaste 10 evaluaciones en la plataforma.	dedicado_10	\N
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1715000000000	Initial1MVP1715000000000
\.


--
-- Data for Name: opciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.opciones (id, pregunta_id, texto, es_correcta) FROM stdin;
1	1	2/4	t
2	1	1/3	f
3	1	3/2	f
4	1	4/2	f
5	2	La mitad	t
6	2	Un tercio	f
7	2	Un cuarto	f
8	2	Toda la pizza	f
9	3	1/2	t
10	3	2/3	f
11	3	1/3	f
12	3	3/4	f
13	4	1/2	t
14	4	1/4	f
15	4	2/3	f
16	4	3/4	f
17	5	2/6	t
18	5	1/6	f
19	5	2/3	f
20	5	1/2	f
21	6	1/2	t
22	6	4/6	f
23	6	6/9	f
24	6	8/12	f
25	7	Comieron la misma cantidad	t
26	7	Carlos	f
27	7	Ana	f
28	7	No se puede saber	f
29	8	2/6	t
30	8	1/6	f
31	8	3/6	f
32	8	4/6	f
33	9	12	t
34	9	7	f
35	9	10	f
36	9	14	f
37	10	10	t
38	10	7	f
39	10	12	f
40	10	8	f
41	11	42	t
42	11	36	f
43	11	49	f
44	11	48	f
45	12	72	t
46	12	64	f
47	12	81	f
48	12	56	f
49	13	56	t
50	13	49	f
51	13	64	f
52	13	48	f
53	14	60	t
54	14	55	f
55	14	65	f
56	14	50	f
57	15	92	t
58	15	82	f
59	15	96	f
60	15	86	f
61	16	90	t
62	16	80	f
63	16	96	f
64	16	21	f
65	17	3/4	t
66	17	3/8	f
67	17	2/4	f
68	17	1/4	f
69	18	3/6	t
70	18	7/6	f
71	18	3/12	f
72	18	7/12	f
73	19	5/8	t
74	19	5/16	f
75	19	6/8	f
76	19	1/8	f
77	20	4/10	t
78	20	4/20	f
79	20	10/10	f
80	20	10/0	f
81	21	3/4	t
82	21	2/6	f
83	21	1/6	f
84	21	2/4	f
85	22	1/2	t
86	22	1/3	f
87	22	1/6	f
88	22	1/9	f
89	23	5/12 de litro	t
90	23	2/1 de litro	f
91	23	4/12 de litro	f
92	23	1/2 de litro	f
93	24	23/20 de kilómetro	t
94	24	5/9 de kilómetro	f
95	24	6/20 de kilómetro	f
96	24	1 kilómetro	f
97	25	1.0	t
98	25	0.10	f
99	25	0.55	f
100	25	1.5	f
101	26	0.7	t
102	26	0.5	f
103	26	Son iguales	f
104	26	No se puede comparar	f
105	27	0.5	t
106	27	1.2	f
107	27	0.2	f
108	27	0.12	f
109	28	3.8	t
110	28	3.10	f
111	28	4.0	f
112	28	3.5	f
113	29	3.2	t
114	29	3.0	f
115	29	2.2	f
116	29	8.0	f
117	30	32	t
118	30	3.20	f
119	30	320	f
120	30	0.32	f
121	31	S/10.50	t
122	31	S/8.40	f
123	31	S/6.70	f
124	31	S/12.50	f
125	32	Tahuantinsuyo	t
126	32	Aztlán	f
127	32	Tiwanaku	f
128	32	Chavín	f
129	33	Cusco	t
130	33	Lima	f
131	33	Trujillo	f
132	33	Cajamarca	f
133	34	Cuatro	t
134	34	Dos	f
135	34	Tres	f
136	34	Cinco	f
137	35	Inti	t
138	35	Supay	f
139	35	Kon	f
140	35	Pachacámac	f
141	36	El Sapa Inca	t
142	36	El Amauta	f
143	36	El Curaca	f
144	36	El Chasqui	f
145	37	Perú	t
146	37	Bolivia	f
147	37	Ecuador	f
148	37	Chile	f
149	38	Chasquis	t
150	38	Amautas	f
151	38	Curacas	f
152	38	Yanas	f
153	39	La llama	t
154	39	El jaguar	f
155	39	El cóndor	f
156	39	El mono	f
157	40	Machu Picchu	t
158	40	Sacsayhuamán	f
159	40	Chan Chan	f
160	40	Ollantaytambo	f
161	41	Quechua	t
162	41	Aymara	f
163	41	Español	f
164	41	Puquina	f
165	42	La Coya	t
166	42	La Aclla	f
167	42	La Mama	f
168	42	La Huaca	f
169	43	Manco Cápac	t
170	43	Pachacútec	f
171	43	Túpac Inca Yupanqui	f
172	43	Huayna Cápac	f
173	44	Atahualpa	t
174	44	Huáscar	f
175	44	Huayna Cápac	f
176	44	Manco Inca	f
177	45	La papa	t
178	45	El trigo	f
179	45	El arroz	f
180	45	La cebada	f
181	46	Inti Raymi	t
182	46	Kapaq Raymi	f
183	46	Situa	f
184	46	Huarachicoy	f
185	47	El oro	t
186	47	La plata	f
187	47	El bronce	f
188	47	El cobre	f
189	48	Coricancha	t
190	48	Sacsayhuamán	f
191	48	Ollantaytambo	f
192	48	Pachacámac	f
193	49	Ayllu	t
194	49	Suyo	f
195	49	Mita	f
196	49	Quipu	f
197	50	Chinchaysuyo	t
198	50	Antisuyo	f
199	50	Qollasuyo	f
200	50	Kuntisuyo	f
201	51	Fibra de lana de camélidos o algodón	t
202	51	Madera tallada muy delgada	f
203	51	Hojas secas de plantas	f
204	51	Barro cocido en forma de cordel	f
205	52	Las cuatro regiones del mundo	t
206	52	El gran río del Sur	f
207	52	La montaña sagrada	f
208	52	El camino del Inca	f
209	53	Chinchaysuyo, Antisuyo, Qollasuyo y Kuntisuyo	t
210	53	Norte, Sur, Este y Oeste	f
211	53	Cusco, Lima, Arequipa y Trujillo	f
212	53	Inca, Coya, Amauta y Chasqui	f
213	54	Cuerdas con nudos para registrar información numérica	t
214	54	Instrumentos musicales usados en las fiestas religiosas	f
215	54	Herramientas de metal para la agricultura	f
216	54	Tipos de tejidos para adornar los templos	f
217	55	Un trabajo obligatorio que los ciudadanos hacían para el Estado	t
218	55	Un tipo de fiesta religiosa en honor al Sol	f
219	55	El nombre de la moneda usada por los incas	f
220	55	Una técnica para construir caminos de piedra	f
221	56	Terrazas de cultivo construidas en las laderas de los cerros	t
222	56	Puentes colgantes que cruzaban los ríos	f
223	56	Almacenes de alimentos en las montañas	f
224	56	Caminos sagrados hacia los templos	f
225	57	Pachacútec	t
226	57	Manco Cápac	f
227	57	Huayna Cápac	f
228	57	Atahualpa	f
229	58	La gran red de caminos que unía todo el Tahuantinsuyo	t
230	58	El nombre del palacio principal del Inca en el Cusco	f
231	58	Una importante ceremonia religiosa del año inca	f
232	58	El título del sacerdote más importante del Coricancha	f
233	59	Para almacenar alimentos, ropa y herramientas del Estado	t
234	59	Para realizar ceremonias y rituales religiosos	f
235	59	Para guardar las armas del ejército inca	f
236	59	Para alojar a los chasquis durante sus viajes	f
237	60	El sistema de ayuda mutua entre los miembros de un ayllu	t
238	60	El tributo anual pagado al Sapa Inca	f
239	60	El ritual de iniciación de los jóvenes guerreros	f
240	60	El nombre del calendario agrícola inca	f
241	61	La diosa de la Tierra, venerada por dar alimentos y vida	t
242	61	La diosa del Mar y de las tormentas	f
243	61	La diosa de la Luna y de la noche	f
244	61	La diosa del Fuego y del volcán	f
245	62	Los sabios y maestros encargados de enseñar y conservar el conocimiento	t
246	62	Los guerreros de élite del ejército del Inca	f
247	62	Los sacerdotes encargados del Coricancha	f
248	62	Los constructores de caminos del Qhapaq Ñan	f
249	63	La plata	t
250	63	El oro	f
251	63	El bronce	f
252	63	El cobre	f
253	64	El curaca	t
254	64	El chasqui	f
255	64	El amauta	f
256	64	El yanacona	f
257	65	1532	t
258	65	1492	f
259	65	1521	f
260	65	1550	f
261	66	Francisco Pizarro	t
262	66	Hernán Cortés	f
263	66	Diego de Almagro	f
264	66	Sebastián de Belalcázar	f
265	67	Piedras perfectamente talladas y encajadas entre sí	t
266	67	Ladrillos de adobe secados al sol	f
267	67	Troncos de madera apilados y amarrados	f
268	67	Barro cocido en hornos de leña	f
269	68	Los orejones o inca de sangre	t
270	68	Los hatun runas	f
271	68	Los yanas	f
272	68	Los mitmaqkuna	f
273	69	El mensajero entre los dioses y los hombres, habitante del mundo de arriba	t
274	69	El dios de la guerra y la conquista	f
275	69	El guardián de las cosechas y los campos	f
276	69	El símbolo del fuego sagrado del Coricancha	f
277	70	Mujeres escogidas para servir al Inca o al dios Sol, tejer y preparar chicha	t
278	70	Guerreras especiales del ejército inca	f
279	70	Sacerdotisas de la Pachamama	f
280	70	Las hijas de los curacas destinadas al comercio	f
281	71	El dios creador del mundo y de los seres humanos	t
282	71	El dios de la guerra y las batallas	f
283	71	El dios protector de las cosechas	f
284	71	El dios de los muertos y el inframundo	f
285	72	Partes de Colombia, Ecuador, Perú, Bolivia, Chile y Argentina	t
286	72	Solo el territorio del actual Perú	f
287	72	Toda América del Sur sin excepción	f
288	72	Solo la región andina del Perú y Bolivia	f
289	73	Registrar información numérica como censos, tributos y producción agrícola	t
290	73	Decorar los templos y palacios del Sapa Inca	f
291	73	Comunicarse con los dioses durante las ceremonias	f
292	73	Medir el tiempo y los ciclos de las estaciones del año	f
293	74	Para ganar más tierra fértil de cultivo en terrenos muy inclinados	t
294	74	Para construir sus ciudades en lugares más elevados y seguros	f
295	74	Para proteger sus ciudades de los enemigos con murallas naturales	f
296	74	Para realizar ceremonias religiosas en lugares de mayor altura	f
297	75	El ayni era ayuda mutua entre iguales del ayllu; la mita era trabajo obligatorio para el Estado	t
298	75	El ayni era para el Estado; la mita era ayuda entre vecinos del ayllu	f
299	75	Eran exactamente lo mismo con diferente nombre	f
300	75	El ayni era solo para los nobles; la mita era exclusiva de los sacerdotes	f
301	76	Porque transformó el pequeño Estado de Cusco en un gran imperio y mandó construir Machu Picchu	t
302	76	Porque fue el primero en gobernar como Sapa Inca	f
303	76	Porque derrotó militarmente a los conquistadores españoles	f
304	76	Porque inventó el sistema de quipus para administrar el Estado	f
305	77	Corrían en relevos por el Qhapaq Ñan, pasando el mensaje de un chasqui al siguiente	t
306	77	Usaban señales de humo desde las cumbres de las montañas	f
307	77	Enviaban palomas mensajeras amaestradas a distancia	f
308	77	Escribían cartas en quipus que llevaban a lomo de llama	f
309	78	Hanan Pacha (mundo de arriba), Kay Pacha (mundo presente) y Ukhu Pacha (mundo de abajo)	t
310	78	Cielo, tierra e infierno	f
311	78	Sol, Luna y Estrellas	f
312	78	Inca, Coya y Ayllu	f
313	79	La disputa entre Huáscar y Atahualpa por el control del trono del Tahuantinsuyo	t
314	79	Una gran sequía que generó hambre y conflictos entre los suyos	f
315	79	La invasión de pueblos guerreros del norte	f
316	79	Una rebelión de los curacas contra el Sapa Inca	f
317	80	Eran grupos de familias trasladadas a nuevas regiones para poblarlas o controlar pueblos conquistados	t
318	80	Eran soldados de élite que protegían las fronteras del Tahuantinsuyo	f
319	80	Eran sacerdotes itinerantes que difundían el culto al Sol	f
320	80	Eran comerciantes que recorrían el Qhapaq Ñan con productos	f
321	81	Proporcionarles alimentos, ropa y herramientas mientras trabajaban para el Estado	t
322	81	Pagarles con oro y plata por su trabajo	f
323	81	Darles tierras y esclavos como recompensa	f
324	81	Enseñarles a leer y escribir en quechua	f
325	82	Porque los incas creían que Manco Cápac fue enviado por Inti para gobernar y civilizar a los hombres	t
326	82	Porque el Inca vivía dentro del templo del Sol	f
327	82	Porque el Inca era el único que podía mirar al Sol directamente	f
328	82	Porque nació durante un eclipse solar en el Coricancha	f
329	83	La domesticación y cultivo de la papa, que luego se extendió a todo el mundo	t
330	83	La invención del arado de hierro para trabajar la tierra	f
331	83	El desarrollo del sistema de riego con canales de agua	f
332	83	La creación de semillas resistentes a las heladas	f
333	84	Combinando conquistas militares, alianzas, traslado de pueblos y difusión del quechua	t
334	84	Usando únicamente la fuerza militar para someter a todos los pueblos	f
335	84	A través del comercio y el intercambio pacífico entre pueblos	f
336	84	Mediante el matrimonio entre nobles incas y nobles de todos los pueblos	f
337	85	Permitía mover el ejército, enviar mensajes por chasquis y distribuir productos a todo el territorio	t
338	85	Era solo un camino ceremonial para las grandes fiestas religiosas	f
339	85	Servía únicamente para que el Inca viajara a visitar su territorio	f
340	85	Era la ruta de comercio internacional con otras civilizaciones	f
341	86	Trece	t
342	86	Diez	f
343	86	Quince	f
344	86	Ocho	f
345	87	El mundo subterráneo (Ukhu Pacha), la sabiduría y el agua subterránea	t
346	87	El dios de la guerra y la victoria en batalla	f
347	87	El guardián de la entrada del Coricancha	f
348	87	La fuerza del océano y las corrientes marinas	f
349	88	Era el templo del Sol donde se guardaban figuras de oro y se realizaban ofrendas a los dioses	t
350	88	Era el palacio donde vivía y gobernaba el Sapa Inca	f
351	88	Era la academia donde los amautas enseñaban a los nobles	f
352	88	Era el lugar donde se guardaban todos los quipus oficiales del Estado	f
353	89	Protección militar, acceso a las colcas del Estado y conservación de sus costumbres y curacas	t
354	89	Tierras de cultivo individuales y exención total del pago de tributos	f
355	89	Libertad total para gobernarse sin ninguna intervención del Inca	f
356	89	Monedas de oro y plata del tesoro del Cusco	f
357	90	Porque lo consideraban su origen divino y porque el Sol era esencial para la agricultura andina	t
358	90	Porque el Sol era el dios más antiguo de toda América	f
359	90	Porque el Sol era el único dios que todos podían ver con sus propios ojos	f
360	90	Porque así lo ordenó el primer Inca al fundar la ciudad del Cusco	f
361	91	A través de la tradición oral, los quipus y los cantos ceremoniales de los amautas	t
362	91	Mediante jeroglíficos pintados en las paredes de los templos	f
363	91	Con pictogramas tallados en piedra en todos los caminos del Inca	f
364	91	Usando un alfabeto secreto conocido solo por el Sapa Inca	f
365	92	La Batalla de Cajamarca	t
366	92	La Batalla de Huamachuco	f
367	92	La Batalla de Sacsayhuamán	f
368	92	La Batalla de Villacuri	f
369	93	Llenar una habitación entera de oro y dos salas de plata	t
370	93	Entregar todos los quipus secretos del Estado inca	f
371	93	Guiarlo personalmente hasta las minas más ricas del Tahuantinsuyo	f
372	93	Rendirse junto con todos sus generales y el ejército inca	f
373	94	Señor o noble	t
374	94	Hijo del Sol	f
375	94	Gran guerrero	f
376	94	Gobernante eterno	f
377	95	El Estado recibía trabajo (mita) y a cambio distribuía alimentos, ropa y herramientas al pueblo	t
378	95	Los productos se vendían en mercados usando monedas de oro	f
379	95	Cada ayllu hacía trueque libremente con los ayllus vecinos	f
380	95	Solo los curacas podían acceder a los productos de las colcas	f
381	96	Sus muros están formados por bloques de piedra de hasta 100 toneladas perfectamente encajados	t
382	96	Porque fue construida en solo un año por miles de trabajadores	f
383	96	Porque resistió decenas de terremotos sin sufrir ningún daño	f
384	96	Porque fue construida completamente sin herramientas de ningún tipo	f
385	97	Se dividía en tres partes: una para el Sol, una para el Estado (Inca) y una para el pueblo	t
386	97	Toda la tierra pertenecía al Inca, que la distribuía a su criterio personal	f
387	97	Cada familia tenía su propia tierra de forma privada e intransferible	f
388	97	Solo los curacas y los nobles podían ser propietarios de tierras	f
389	98	Una monarquía teocrática con el Sapa Inca como máxima autoridad divina y política	t
390	98	Una república con representantes elegidos por cada ayllu	f
391	98	Una federación de pueblos con derechos iguales para todos	f
392	98	Una oligarquía gobernada por el consejo de sacerdotes del Sol	f
393	99	Porque era el centro político, religioso y administrativo del que partían todos los caminos del Inca	t
394	99	Porque era la ciudad más antigua de toda América del Sur	f
395	99	Porque estaba ubicada exactamente en el centro geográfico de Sudamérica	f
396	99	Porque era el lugar donde los dioses incas habían creado el mundo	f
397	100	El sumo sacerdote del Sol, segunda autoridad después del Sapa Inca	t
398	100	El general jefe del ejército inca en las campañas militares	f
399	100	El administrador principal de las colcas del Estado	f
400	100	El jefe de todos los quipucamayoc del Tahuantinsuyo	f
401	101	El inca de sangre era descendiente real del Sapa Inca; el de privilegio recibía el título por sus méritos	t
402	101	No había diferencia real entre los dos tipos, era solo un nombre diferente	f
403	101	El inca de sangre era más joven; el inca de privilegio era de mayor edad	f
404	101	El inca de sangre gobernaba el norte; el de privilegio gobernaba el sur	f
405	102	Creían que el Inca seguía presente y podía ser consultado; su cuerpo era tratado como si estuviera vivo	t
406	102	Para exhibirlos como ejemplo de vida virtuosa a las generaciones futuras	f
407	102	Como una ofrenda especial para el dios Sol en el Coricancha	f
408	102	Para demostrar el poder del Tahuantinsuyo ante los pueblos conquistados	f
409	103	Debilitó enormemente al Estado inca y facilitó la conquista española	t
410	103	Provocó la división definitiva y permanente del Tahuantinsuyo en dos reinos	f
411	103	Destruyó completamente la ciudad sagrada del Cusco	f
412	103	Eliminó para siempre la institución de los curacas en todo el territorio	f
413	104	Sacrificios especiales, generalmente de niños, ofrecidos en ceremonias importantes a los dioses	t
414	104	Los sacerdotes de mayor rango del templo Coricancha	f
415	104	Las fiestas de renovación celebradas al inicio de cada año inca	f
416	104	Las ofrendas de objetos de oro depositadas en el templo del Sol	f
417	105	La fiesta del Sol celebrada en el solsticio de invierno (junio) para asegurar la continuidad del Sol	t
418	105	La ceremonia de coronación del nuevo Sapa Inca al inicio de su gobierno	f
419	105	La fiesta de la Luna celebrada en el mes de diciembre	f
420	105	El ritual anual que marcaba el inicio de la campaña militar del Inca	f
421	106	La quinua, el maíz y el tomate, que hoy se consumen en todo el mundo	t
422	106	El trigo, el arroz y la cebada, que los incas cultivaron antes que nadie	f
423	106	Solo la papa y el maíz tuvieron importancia a nivel mundial	f
424	106	El café, el cacao y la vainilla fueron los principales aportes incas	f
425	107	Producir tejidos finos de alta calidad y chicha sagrada para el Estado y las ceremonias	t
426	107	Administrar y controlar los productos de las colcas estatales	f
427	107	Enseñar el quechua a los niños de los pueblos conquistados	f
428	107	Llevar los mensajes del Inca en rutas que los hombres no podían recorrer	f
429	108	Eran los especialistas que podían leer e interpretar los quipus para el Estado	t
430	108	Eran los constructores encargados de crear los quipus con fibras especiales	f
431	108	Eran los sacerdotes que usaban los quipus en las ceremonias religiosas	f
432	108	Eran los guerreros que protegían los archivos de quipus del Estado	f
433	109	El cóndor (Hanan Pacha), el puma (Kay Pacha) y la serpiente (Ukhu Pacha)	t
434	109	El águila, el jaguar y el cocodrilo	f
435	109	El cóndor, la llama y el mono	f
436	109	El puma, el oso y el cóndor	f
437	110	Era la 'casa de las escogidas', donde las acllas vivían, trabajaban y producían para el Estado	t
438	110	Era la academia donde estudiaban los futuros curacas de cada región	f
439	110	Era el templo secundario dedicado a la diosa Luna (Mama Quilla)	f
440	110	Era el cuartel donde se entrenaba el ejército de élite del Inca	f
441	111	La minka era trabajo local para obras del ayllu (canales, caminos); la mita era trabajo obligatorio para el Estado inca	t
442	111	Eran exactamente lo mismo, se usaban indistintamente en todo el territorio	f
443	111	La minka era trabajo de hombres y la mita era trabajo exclusivo de mujeres	f
444	111	La minka era pagada en productos y la mita era completamente voluntaria	f
445	112	El Qollasuyo, que se extendía desde el Cusco hasta el norte de Argentina y Chile	t
446	112	El Chinchaysuyo, por incluir los ricos reinos del norte como el de los chimúes	f
447	112	El Antisuyo, por abarcar toda la vasta selva amazónica	f
448	112	El Kuntisuyo, por extenderse a lo largo de toda la costa pacífica	f
449	113	Colocar al Inti por encima de todos los dioses, pero permitiendo que cada pueblo mantuviera sus cultos locales	t
450	113	Eliminar completamente todas las religiones de los pueblos conquistados	f
451	113	Hacer de Viracocha el único dios permitido en todo el Tahuantinsuyo	f
452	113	Prohibir todos los rituales y ceremonias en los territorios conquistados	f
453	114	La guerra civil inca, las epidemias de enfermedades europeas y la superioridad tecnológica española	t
454	114	La falta de valor del ejército inca al ver por primera vez a los caballos españoles	f
455	114	La traición masiva de todos los curacas que apoyaron a los españoles desde el inicio	f
456	114	Una gran sequía de varios años que había dejado al ejército inca sin alimentos	f
457	115	Líneas imaginarias que partían del Coricancha y organizaban el espacio sagrado del Cusco, distribuyendo huacas y ceremonias	t
458	115	El consejo de nobles que asesoraba al Sapa Inca en sus decisiones de gobierno	f
459	115	El camino principal que cruzaba el Cusco de norte a sur conectando los templos	f
460	115	El título honorífico que recibía el gobernador civil de la ciudad del Cusco	f
461	116	Huayna Cápac no designó claramente un sucesor único, dejando el poder dividido entre sus hijos	t
462	116	Huáscar asesinó a Huayna Cápac para tomar el poder antes de tiempo	f
463	116	Atahualpa fue apoyado por los españoles antes de su llegada oficial al Tahuantinsuyo	f
464	116	El consejo de sacerdotes eligió a dos Incas al mismo tiempo por error	f
465	117	Permitió controlar tierras de distintos climas (costa, sierra, selva) para obtener una amplia variedad de productos	t
466	117	La geografía fue principalmente un obstáculo que los incas nunca lograron superar completamente	f
467	117	Solo la sierra alta fue aprovechada; los incas nunca llegaron a controlar la costa o la selva	f
468	117	La geografía plana del altiplano fue la única base del desarrollo económico inca	f
469	118	Eran los grupos familiares de cada Inca fallecido que administraban sus tierras y cuidaban su momia, creando poderosas facciones	t
470	118	Eran grupos de sacerdotes especializados en los rituales del dios Sol en el Coricancha	f
471	118	Eran los batallones de élite del ejército inca designados para proteger al Sapa Inca	f
472	118	Eran los centros administrativos instalados en la capital de cada suyo	f
473	119	Los quipus usaban un sistema posicional de base 10 para registrar grandes cantidades en censos y tributos	t
474	119	Los quipus funcionaban con un sistema binario similar al de los computadores modernos	f
475	119	El sistema decimal fue una innovación introducida por los españoles tras la conquista	f
476	119	Los quipus no tenían ningún sistema numérico, solo usaban colores con valor simbólico	f
477	120	Los incas heredaron elementos culturales de Tiwanaku, incluyendo técnicas agrícolas y artísticas que incorporaron a su civilización	t
478	120	Tiwanaku fue fundada por los incas como su primera capital antes de mudarse al Cusco	f
479	120	No existe ninguna relación arqueológica o cultural entre ambas civilizaciones	f
480	120	Tiwanaku fue completamente destruida por los incas durante su expansión hacia el sur	f
481	121	Dataciones de carbono 14 en los restos humanos hallados, que ubican el sitio en mediados del siglo XV	t
482	121	Una inscripción en quechua encontrada en las paredes del templo principal	f
483	121	Los quipus hallados dentro del sitio que mencionan el nombre de Pachacútec	f
484	121	Las crónicas escritas por los propios incas sobre la construcción del sitio	f
485	122	La viruela mató al Inca Huayna Cápac y a gran parte de la nobleza inca, desestabilizando el Estado	t
486	122	Las enfermedades europeas llegaron solo después de la conquista, no antes	f
487	122	Las enfermedades solo afectaron a los pueblos de la costa, no a los incas serranos	f
488	122	Los incas tenían rituales medicinales que los protegían de las enfermedades extranjeras	f
489	123	Marcó el fin del Estado inca independiente, aunque la resistencia continuó en Vilcabamba hasta 1572	t
490	123	Significó el fin total e inmediato de toda la civilización inca sin ninguna resistencia posterior	f
491	123	No tuvo mayor impacto porque el Tahuantinsuyo ya había sido completamente destruido antes	f
492	123	Provocó la rendición inmediata y pacífica de todas las tropas y pueblos del Tahuantinsuyo	f
493	124	Fue conquistado en 1572 cuando los españoles capturaron y ejecutaron al último Inca, Túpac Amaru I	t
494	124	Sobrevivió hasta el siglo XVIII cuando fue integrado pacíficamente al Virreinato del Perú	f
495	124	Nunca fue conquistado militarmente; firmó un tratado de paz con los españoles	f
496	124	Fue destruido en 1545 durante una gran batalla en la selva del Cusco	f
497	125	Era la región más poblada y productiva, incluyendo los poderosos reinos de Chimú y Chincha	t
498	125	Era el suyo más pequeño pero contenía las minas de oro más ricas del Tahuantinsuyo	f
499	125	Era el suyo de mayor importancia religiosa por contener el oráculo de Pachacámac exclusivamente	f
500	125	Era el principal suyo militar por ser la frontera norte frente a los pueblos amazónicos	f
501	126	Cada color representaba una categoría (personas, tributos, ganado) y la posición del nudo indicaba el valor numérico	t
502	126	Los colores eran completamente decorativos y no tenían ningún significado informativo	f
503	126	Cada color representaba a uno de los cuatro suyos y los nudos indicaban los años de cada gobernante	f
504	126	Los colores indicaban el nivel de importancia del mensaje y los nudos el nombre del destinatario	f
505	127	Se les permitía conservar su cargo y sus privilegios siempre que aceptaran la soberanía del Sapa Inca	t
506	127	Eran reemplazados inmediatamente por curacas incas de sangre provenientes del Cusco	f
507	127	Eran ejecutados públicamente como símbolo del poder del Tahuantinsuyo	f
508	127	Eran enviados al Cusco como rehenes para garantizar la lealtad de su pueblo	f
509	128	La cerámica Killke fue producida por los primeros incas en el Cusco desde el siglo XII, antes de la expansión imperial	t
510	128	Fue un estilo cerámico que los incas copiaron de los chimúes al conquistar la costa norte	f
511	128	La cerámica Killke fue producida en el Qollasuyo como tributo especial al Sapa Inca	f
512	128	No existe ninguna relación comprobada entre la cerámica Killke y la cultura inca	f
513	129	Los incas respetaron el oráculo por su gran prestigio y construyeron un templo al Sol junto a él	t
514	129	Los incas destruyeron el oráculo porque representaba una amenaza a la supremacía del dios Sol	f
515	129	El oráculo fue trasladado físicamente al Cusco para estar bajo control del Willaq Umu	f
516	129	Los incas prohibieron a los pueblos costeños visitar el oráculo para mantener el control religioso	f
517	130	Porque en pocas décadas destruyó miles de años de desarrollo cultural, religioso y político andino	t
518	130	Porque los españoles reconocieron la superioridad inca y tuvieron que aprender el quechua para gobernar	f
519	130	Porque fue la primera vez que dos civilizaciones de igual tamaño se encontraban en el mundo	f
520	130	Porque los incas adoptaron voluntariamente la cultura española sin ninguna resistencia	f
521	131	Por ser una red de más de 30,000 km que unía seis países andinos actuales, la mayor obra de ingeniería precolombina	t
522	131	Por ser el camino más antiguo de América, con más de 5,000 años de antigüedad comprobada	f
523	131	Por haber sido el único sistema de comunicación en América antes de la llegada de los europeos	f
524	131	Por contener pinturas rupestres incas que narran la historia completa del Tahuantinsuyo	f
\.


--
-- Data for Name: preguntas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.preguntas (id, enunciado, tipo, curso_id, tema_id, dificultad) FROM stdin;
1	¿Cuál fracción es equivalente a 1/2?	evaluacion_tema	1	1	muy_facil
2	Si tengo 2/4 de una pizza, ¿cuánto es?	evaluacion_tema	1	1	muy_facil
3	¿Qué fracción es equivalente a 3/6?	evaluacion_tema	1	1	facil
4	La fracción 4/8 es equivalente a:	evaluacion_tema	1	1	facil
5	Si multiplico 1/3 por 2/2, obtengo:	evaluacion_tema	1	1	normal
6	¿Cuál de estas fracciones NO es equivalente a 2/3?	evaluacion_tema	1	1	normal
7	Si Carlos comió 3/12 de una pizza y Ana comió 1/4 de la misma pizza, ¿quién comió más?	evaluacion_tema	1	1	dificil
8	Encuentra la fracción equivalente a 5/15 que tenga denominador 6.	evaluacion_tema	1	1	muy_dificil
9	¿Cuánto es 3 × 4?	evaluacion_tema	1	2	muy_facil
10	¿Cuánto es 5 × 2?	evaluacion_tema	1	2	muy_facil
11	¿Cuánto es 6 × 7?	evaluacion_tema	1	2	facil
12	¿Cuánto es 8 × 9?	evaluacion_tema	1	2	facil
13	Si una caja tiene 8 chocolates y compro 7 cajas, ¿cuántos chocolates tengo en total?	evaluacion_tema	1	2	normal
14	¿Cuánto es 12 × 5?	evaluacion_tema	1	2	normal
15	¿Cuál es el resultado de 23 × 4?	evaluacion_tema	1	2	dificil
16	En el zoológico hay 15 jaulas con 6 monos cada una. ¿Cuántos monos hay en total?	evaluacion_tema	1	2	muy_dificil
17	¿Cuánto es 1/4 + 2/4?	evaluacion_tema	1	3	muy_facil
18	¿Cuánto es 5/6 - 2/6?	evaluacion_tema	1	3	muy_facil
19	¿Cuánto es 3/8 + 2/8?	evaluacion_tema	1	3	facil
20	¿Cuánto es 7/10 - 3/10?	evaluacion_tema	1	3	facil
21	¿Cuánto es 1/2 + 1/4?	evaluacion_tema	1	3	normal
22	¿Cuánto es 2/3 - 1/6?	evaluacion_tema	1	3	normal
23	María tiene 3/4 de litro de jugo y bebió 1/3 de litro. ¿Cuánto le queda?	evaluacion_tema	1	3	dificil
24	Pedro caminó 2/5 de kilómetro en la mañana y 3/4 de kilómetro en la tarde. ¿Cuánto caminó en total?	evaluacion_tema	1	3	muy_dificil
25	¿Cuánto es 0.5 + 0.5?	evaluacion_tema	1	4	muy_facil
26	¿Cuál número es mayor: 0.7 o 0.5?	evaluacion_tema	1	4	muy_facil
27	¿Cómo se escribe la fracción 1/2 en forma decimal?	evaluacion_tema	1	4	facil
28	¿Cuánto es 2.5 + 1.3?	evaluacion_tema	1	4	normal
29	¿Cuánto es 5.6 - 2.4?	evaluacion_tema	1	4	normal
30	¿Cuál es el resultado de 3.2 × 10?	evaluacion_tema	1	4	dificil
31	Ana compró 2.5 kg de manzanas a S/4.20 el kilogramo. ¿Cuánto pagó en total?	evaluacion_tema	1	4	muy_dificil
32	¿Cómo se llamaba el gran Estado que formaron los incas en América del Sur?	evaluacion_tema	5	17	muy_facil
33	¿Cuál era la capital del Tahuantinsuyo?	evaluacion_tema	5	17	muy_facil
34	¿Cuántas regiones o suyos tenía el Tahuantinsuyo?	evaluacion_tema	5	17	muy_facil
35	¿Cómo se llamaba el dios principal de los incas, el dios del Sol?	evaluacion_tema	5	17	muy_facil
36	¿Qué nombre recibía el gobernante máximo del Tahuantinsuyo?	evaluacion_tema	5	17	muy_facil
37	¿En qué país actual se encontraba la capital del Tahuantinsuyo?	evaluacion_tema	5	17	muy_facil
38	¿Cómo se llamaban los mensajeros del Inca que corrían para llevar mensajes por todo el territorio?	evaluacion_tema	5	17	muy_facil
39	¿Cuál era el animal más importante para los incas, usado para el transporte y la obtención de lana?	evaluacion_tema	5	17	muy_facil
40	¿Cuál es la ciudadela inca más famosa del mundo, ubicada en lo alto de una montaña?	evaluacion_tema	5	17	muy_facil
41	¿Cuál era el idioma principal que se hablaba en el Tahuantinsuyo?	evaluacion_tema	5	17	muy_facil
42	¿Qué nombre tenía la esposa principal del Sapa Inca?	evaluacion_tema	5	17	muy_facil
43	¿Quién fue el primer Inca según la tradición oral de los incas?	evaluacion_tema	5	17	muy_facil
44	¿Cuál fue el último Inca que reinó antes de la llegada de los conquistadores españoles?	evaluacion_tema	5	17	muy_facil
45	¿Qué planta, originaria de los Andes, era el alimento más importante en la dieta de los incas?	evaluacion_tema	5	17	muy_facil
46	¿Cuál era la gran fiesta que los incas celebraban cada año en honor al dios Sol?	evaluacion_tema	5	17	muy_facil
47	¿Qué metal era el más sagrado para los incas, llamado el 'sudor del Sol'?	evaluacion_tema	5	17	muy_facil
48	¿Cómo se llamaba el gran templo del Sol, el más importante de todo el Tahuantinsuyo?	evaluacion_tema	5	17	muy_facil
49	¿Qué nombre recibía la comunidad familiar que era la base de la sociedad inca?	evaluacion_tema	5	17	muy_facil
50	¿Qué suyo o región del Tahuantinsuyo se encontraba al norte de la capital Cusco?	evaluacion_tema	5	17	muy_facil
51	¿De qué material estaban hechas las cuerdas con nudos que los incas usaban para registrar información?	evaluacion_tema	5	17	muy_facil
52	¿Qué significa la palabra 'Tahuantinsuyo'?	evaluacion_tema	5	17	facil
53	¿Cuáles son los cuatro suyos que formaban el Tahuantinsuyo?	evaluacion_tema	5	17	facil
54	¿Qué eran los quipus y para qué se usaban?	evaluacion_tema	5	17	facil
55	¿Qué era la mita en el Tahuantinsuyo?	evaluacion_tema	5	17	facil
56	¿Qué eran los andenes que construyeron los incas?	evaluacion_tema	5	17	facil
57	¿Cuál fue el Inca que más amplió el territorio del Tahuantinsuyo, convirtiéndolo en un gran imperio?	evaluacion_tema	5	17	facil
58	¿Qué era el Qhapaq Ñan?	evaluacion_tema	5	17	facil
59	¿Para qué servían las colcas o qollqas en el Tahuantinsuyo?	evaluacion_tema	5	17	facil
60	¿Qué era el 'ayni' en la cultura inca?	evaluacion_tema	5	17	facil
61	¿Qué era la Pachamama para los incas?	evaluacion_tema	5	17	facil
62	¿Quiénes eran los amautas en el Tahuantinsuyo?	evaluacion_tema	5	17	facil
63	¿Qué metal llamaban los incas 'las lágrimas de la Luna'?	evaluacion_tema	5	17	facil
64	¿Cómo se llamaba el jefe local que administraba los ayllus y servía de intermediario con el Estado inca?	evaluacion_tema	5	17	facil
65	¿En qué año llegaron los conquistadores españoles al Tahuantinsuyo y capturaron al Inca Atahualpa?	evaluacion_tema	5	17	facil
66	¿Quién fue el conquistador español que lideró la expedición que derrotó al Tahuantinsuyo?	evaluacion_tema	5	17	facil
67	¿Qué técnica constructiva caracterizaba las edificaciones incas, sin usar cemento ni argamasa?	evaluacion_tema	5	17	facil
68	¿Qué nombre recibía la clase noble del Tahuantinsuyo, conocida por usar grandes orejeras de oro?	evaluacion_tema	5	17	facil
69	¿Qué representaba el cóndor en la cosmovisión inca?	evaluacion_tema	5	17	facil
70	¿Qué eran las acllas o mamacuna en el Tahuantinsuyo?	evaluacion_tema	5	17	facil
71	¿Quién era Viracocha para los incas?	evaluacion_tema	5	17	facil
72	¿Qué extensión territorial llegó a abarcar el Tahuantinsuyo en su época de mayor poder?	evaluacion_tema	5	17	normal
73	¿Cuál era la principal función de los quipus en la administración del Tahuantinsuyo?	evaluacion_tema	5	17	normal
74	¿Por qué los incas construyeron andenes en las laderas de las montañas?	evaluacion_tema	5	17	normal
75	¿Qué diferencia existía entre el 'ayni' y la 'mita' como formas de trabajo en el Tahuantinsuyo?	evaluacion_tema	5	17	normal
76	¿Por qué Pachacútec es considerado el Inca más importante de toda la historia del Tahuantinsuyo?	evaluacion_tema	5	17	normal
77	¿Cómo funcionaba el sistema de chasquis para comunicar mensajes a larga distancia?	evaluacion_tema	5	17	normal
78	¿Cómo llamaban los incas a los tres mundos de su visión del universo?	evaluacion_tema	5	17	normal
79	¿Cuál fue la causa principal de la guerra civil inca justo antes de la llegada de los españoles?	evaluacion_tema	5	17	normal
80	¿Qué función cumplían los mitmaqkuna en la estrategia de expansión del Tahuantinsuyo?	evaluacion_tema	5	17	normal
81	¿Cuáles eran las obligaciones del Estado inca hacia las personas que cumplían la mita?	evaluacion_tema	5	17	normal
82	¿Por qué el Sapa Inca era considerado hijo del Sol por su pueblo?	evaluacion_tema	5	17	normal
83	¿Cuál es el mayor legado agrícola del Tahuantinsuyo al mundo entero?	evaluacion_tema	5	17	normal
84	¿Cómo los incas lograron unificar a tantos pueblos diferentes bajo un solo Estado?	evaluacion_tema	5	17	normal
85	¿Cuál era la importancia del Qhapaq Ñan más allá de ser solo un camino de transporte?	evaluacion_tema	5	17	normal
86	¿Cuántos Incas gobernaron el Tahuantinsuyo desde Manco Cápac hasta Atahualpa?	evaluacion_tema	5	17	normal
87	¿Qué representaba la serpiente (amaru) en la mitología inca?	evaluacion_tema	5	17	normal
88	¿Cuál fue la importancia religiosa del Coricancha para los incas?	evaluacion_tema	5	17	normal
89	¿Qué ofrecía el Estado inca a los pueblos que se unían voluntariamente al Tahuantinsuyo?	evaluacion_tema	5	17	normal
90	¿Por qué los incas adoraban al Sol (Inti) por encima de todos los demás dioses?	evaluacion_tema	5	17	normal
91	¿Cómo se transmitía el saber y la historia en el Tahuantinsuyo sin escritura alfabética?	evaluacion_tema	5	17	normal
92	¿En qué batalla los españoles capturaron al Sapa Inca Atahualpa en 1532?	evaluacion_tema	5	17	dificil
93	¿Qué ofreció el Inca Atahualpa a Francisco Pizarro a cambio de su libertad?	evaluacion_tema	5	17	dificil
94	¿Cuál es el significado original de la palabra 'inca' en quechua?	evaluacion_tema	5	17	dificil
95	¿Cómo funcionaba la redistribución de los productos almacenados en las colcas del Tahuantinsuyo?	evaluacion_tema	5	17	dificil
96	¿Por qué Sacsayhuamán es considerada una obra de ingeniería extraordinaria?	evaluacion_tema	5	17	dificil
97	¿Cómo se distribuía la tierra agrícola en el Tahuantinsuyo?	evaluacion_tema	5	17	dificil
98	¿Qué tipo de organización política tenía el Tahuantinsuyo?	evaluacion_tema	5	17	dificil
99	¿Por qué los incas llamaban al Cusco el 'ombligo del mundo'?	evaluacion_tema	5	17	dificil
100	¿Cuál era el cargo del Willaq Umu en el Tahuantinsuyo?	evaluacion_tema	5	17	dificil
101	¿Cuál era la diferencia entre 'inca de sangre' e 'inca de privilegio'?	evaluacion_tema	5	17	dificil
102	¿Por qué los incas momificaban a sus gobernantes muertos?	evaluacion_tema	5	17	dificil
103	¿Cuál fue la consecuencia más grave de la guerra civil entre Huáscar y Atahualpa para el Tahuantinsuyo?	evaluacion_tema	5	17	dificil
104	¿Qué eran los 'capacocha' en la religión inca?	evaluacion_tema	5	17	dificil
105	¿Qué fue el Inti Raymi y cuándo se celebraba en el calendario inca?	evaluacion_tema	5	17	dificil
106	¿Qué productos agrícolas andinos, además de la papa, fueron aportes del Tahuantinsuyo a la alimentación mundial?	evaluacion_tema	5	17	dificil
107	¿Cuál era el rol específico de las acllas en la economía del Tahuantinsuyo?	evaluacion_tema	5	17	dificil
108	¿Qué papel cumplían los quipucamayoc en la administración del Tahuantinsuyo?	evaluacion_tema	5	17	dificil
109	¿Qué tres animales sagrados representaban los tres mundos de la cosmovisión inca?	evaluacion_tema	5	17	dificil
110	¿Cuál era la función del 'Acllahuasi' en las ciudades del Tahuantinsuyo?	evaluacion_tema	5	17	dificil
111	¿Cuál era la diferencia entre el trabajo comunitario 'minka' y la 'mita' estatal en el Tahuantinsuyo?	evaluacion_tema	5	17	dificil
112	Según la división territorial, ¿qué suyo del Tahuantinsuyo ocupaba la mayor extensión geográfica?	evaluacion_tema	5	17	muy_dificil
113	¿Cuál fue la estrategia religiosa de Pachacútec al expandir el Tahuantinsuyo respecto a los dioses locales?	evaluacion_tema	5	17	muy_dificil
114	¿Cuáles fueron las razones principales que explican la rápida caída del Tahuantinsuyo ante 168 soldados españoles?	evaluacion_tema	5	17	muy_dificil
115	¿Qué fue el sistema de 'ceques' en la organización sagrada de la ciudad del Cusco?	evaluacion_tema	5	17	muy_dificil
116	¿Cuál fue el proceso que originó la guerra civil entre Huáscar y Atahualpa?	evaluacion_tema	5	17	muy_dificil
117	¿Cómo la geografía andina de 'pisos ecológicos' contribuyó al desarrollo y la prosperidad del Tahuantinsuyo?	evaluacion_tema	5	17	muy_dificil
118	¿Cuál era la función político-religiosa de las 'panacas' en la estructura del poder inca?	evaluacion_tema	5	17	muy_dificil
119	¿Cómo se relaciona el sistema decimal con la organización de los quipus y la administración del Tahuantinsuyo?	evaluacion_tema	5	17	muy_dificil
120	¿Cuál fue la relación histórica entre el Tahuantinsuyo y la cultura Tiwanaku del lago Titicaca?	evaluacion_tema	5	17	muy_dificil
121	¿Qué evidencia arqueológica permite afirmar que Machu Picchu fue construida durante el reinado de Pachacútec (siglo XV)?	evaluacion_tema	5	17	muy_dificil
122	¿Cuál fue el impacto de las epidemias europeas en el Tahuantinsuyo ANTES de la llegada de Pizarro en 1532?	evaluacion_tema	5	17	muy_dificil
123	¿Cuál fue el significado histórico de la ejecución del Inca Atahualpa en 1533 para el futuro del Perú?	evaluacion_tema	5	17	muy_dificil
124	¿Cuál fue el destino final del Estado Inca de Vilcabamba, la resistencia inca tras la caída del Cusco?	evaluacion_tema	5	17	muy_dificil
125	¿Cuál era la importancia geopolítica del suyo Chinchaysuyo dentro del Tahuantinsuyo?	evaluacion_tema	5	17	muy_dificil
126	¿Cómo el significado de los colores y la posición de los nudos en los quipus permitía codificar información compleja?	evaluacion_tema	5	17	muy_dificil
127	¿Cuál fue la política del Tahuantinsuyo respecto a los curacas de los pueblos que se sometían voluntariamente?	evaluacion_tema	5	17	muy_dificil
128	¿Qué relación existe entre la 'cerámica Killke' y los orígenes históricos del Tahuantinsuyo?	evaluacion_tema	5	17	muy_dificil
129	¿Cómo el oráculo de Pachacámac, en la costa del Perú, se integró al sistema religioso del Tahuantinsuyo?	evaluacion_tema	5	17	muy_dificil
130	¿Por qué la conquista española del Tahuantinsuyo es considerada uno de los mayores choques culturales de la historia?	evaluacion_tema	5	17	muy_dificil
131	¿Cuál fue el verdadero alcance del Qhapaq Ñan y por qué la UNESCO lo declaró Patrimonio de la Humanidad en 2014?	evaluacion_tema	5	17	muy_dificil
\.


--
-- Data for Name: puntos_curso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.puntos_curso (id, usuario_id, curso_id, puntos_total, posicion, actualizado_en) FROM stdin;
238b5a6c-0475-4b34-ad43-b7b7463f7c88	a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	1	110	1	2026-05-13 22:30:13.239229+00
70612480-e7f2-4199-aa26-2140d451216d	599acc4f-badf-41d2-a87d-a336f82b0241	1	75	2	2026-05-14 00:13:35.726177+00
def8c3db-11ff-425d-a1d6-84a1af897f7f	a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	5	45	1	2026-06-11 23:23:44.511899+00
\.


--
-- Data for Name: respuestas_evaluacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.respuestas_evaluacion (id, evaluacion_id, pregunta_id, opcion_id, es_correcta, tiempo_respuesta_seg) FROM stdin;
c7265666-25f5-4dea-87f2-ad7a24ae1a43	6635083f-511d-4485-b1e6-036fa3bee758	3	9	t	15
9d2fb69c-0b31-42af-b583-19e30a7092a4	6635083f-511d-4485-b1e6-036fa3bee758	6	21	t	18
091cc65b-0a73-4151-b80c-3af93e9290c0	6635083f-511d-4485-b1e6-036fa3bee758	7	25	t	22
51caa071-b4c6-46bc-99c4-2a32f41b940a	6635083f-511d-4485-b1e6-036fa3bee758	5	17	t	20
e6888a61-684a-4ff1-8b2b-4ccfb2a9a670	6635083f-511d-4485-b1e6-036fa3bee758	4	13	t	12
f9c48577-1570-4988-b377-c82e54aeea63	b1b0c121-c53a-4ceb-aee2-295fc2475469	6	22	f	18
61a4a358-692d-4862-9b6b-a1e3632bc3b0	b1b0c121-c53a-4ceb-aee2-295fc2475469	5	17	t	20
d50886e6-aa1f-4e40-85bc-ebaa1ab987bc	b1b0c121-c53a-4ceb-aee2-295fc2475469	3	9	t	15
0c556ffe-3a44-4dca-bbdb-32998a0f7001	b1b0c121-c53a-4ceb-aee2-295fc2475469	7	25	t	22
cb10591a-e467-49cf-a0d7-38a2e41b7d87	b1b0c121-c53a-4ceb-aee2-295fc2475469	4	13	t	19
57bed773-2548-4c53-b55d-b55fa124d105	4f50ddf8-1831-4046-9487-67dd79bba1cf	6	21	t	45
6b4f50ec-1b4c-4e96-9636-985e21028e2a	4f50ddf8-1831-4046-9487-67dd79bba1cf	7	26	f	50
39d25b7c-8e67-4198-b65e-9268b6a043e9	4f50ddf8-1831-4046-9487-67dd79bba1cf	8	31	f	55
bc9245b8-6a89-4a47-a70f-659efa099d37	4f50ddf8-1831-4046-9487-67dd79bba1cf	5	18	f	60
4628c797-70b0-4e13-87bf-41a00ce877aa	c6b7f6e0-81fc-413a-8504-81d1ce58d810	5	18	f	6
76a70239-6ffb-4917-92e9-98d87b790f4d	c6b7f6e0-81fc-413a-8504-81d1ce58d810	6	21	t	2
38bbe346-0c7e-4d71-9e9e-9a8c45289be3	c6b7f6e0-81fc-413a-8504-81d1ce58d810	8	31	f	1
76aeb749-2622-4bd1-be88-3c4d704b02ae	c6b7f6e0-81fc-413a-8504-81d1ce58d810	7	25	t	2
0c5d53ee-9335-4ace-bc61-961a9a1ffeaa	d6fa57a5-f232-4b76-bed7-13009db1d664	4	13	t	22
792b7085-6e86-4b2c-9982-a116a2ac794c	d6fa57a5-f232-4b76-bed7-13009db1d664	3	9	t	4
b969236c-8272-441b-96ef-3d8bacd62d4f	d6fa57a5-f232-4b76-bed7-13009db1d664	5	20	f	10
cc85370c-157d-4d17-854a-03498e413039	d6fa57a5-f232-4b76-bed7-13009db1d664	6	23	f	2
e8d20fcd-3f78-46c0-a2ef-0bcbfa57a968	d6fa57a5-f232-4b76-bed7-13009db1d664	7	25	t	1
3a84a45e-0365-4036-9620-c35e34cd3979	8605b2f4-647b-4ec9-9429-4ee2a44416f2	72	285	t	9
bd5ff48e-2950-473b-aedf-6d65e3da0a71	8605b2f4-647b-4ec9-9429-4ee2a44416f2	87	345	t	3
981625d1-2732-45d0-a40e-e44874eb2f08	8605b2f4-647b-4ec9-9429-4ee2a44416f2	90	359	f	1
94929076-3a04-4d42-9fec-806b60ab2234	8605b2f4-647b-4ec9-9429-4ee2a44416f2	88	351	f	1
f21b01e9-174d-42b1-9abc-859e6874119b	8605b2f4-647b-4ec9-9429-4ee2a44416f2	89	353	t	1
aed2f7b7-b210-45a5-9bd8-d2d580eeb560	8605b2f4-647b-4ec9-9429-4ee2a44416f2	102	405	t	1
36aed09d-fa3e-4b5c-95b6-a87b49c29100	8605b2f4-647b-4ec9-9429-4ee2a44416f2	107	425	t	1
2fff4e45-f8d1-46b2-92ba-3306efcf6cee	8605b2f4-647b-4ec9-9429-4ee2a44416f2	59	235	f	1
34d281ba-00d8-48da-b839-9e69318f238f	63021aae-f845-4170-8ed9-3b15455f6fca	79	316	f	2
7cb9c4aa-6c1f-4e72-9ba4-5ddf327881e9	63021aae-f845-4170-8ed9-3b15455f6fca	72	288	f	1
8f728ea2-c1aa-4ae9-8975-322fac94ee1a	63021aae-f845-4170-8ed9-3b15455f6fca	88	351	f	1
a910ff80-7205-48a1-8161-e5418c33c83a	63021aae-f845-4170-8ed9-3b15455f6fca	91	361	t	1
b297ede9-f853-4287-a8d8-d8b0d4b2a2d7	63021aae-f845-4170-8ed9-3b15455f6fca	103	409	t	1
bf626bed-a243-4374-924e-a2e9ac065def	63021aae-f845-4170-8ed9-3b15455f6fca	84	333	t	1
7a042621-092e-40c5-a263-da6e173759eb	63021aae-f845-4170-8ed9-3b15455f6fca	104	413	t	1
28f773ea-f29c-4e44-9d0b-83b480882063	63021aae-f845-4170-8ed9-3b15455f6fca	54	216	f	1
434cccb7-4f0a-4560-8aeb-227d0c4b02ce	09533b6c-1ede-495f-ba27-f26204e812a2	55	218	f	1
0337e6a0-9ac4-4db1-a356-ead4dced47d1	09533b6c-1ede-495f-ba27-f26204e812a2	68	270	f	1
e60eb690-89a6-49cf-a70d-82dcdecfebf5	09533b6c-1ede-495f-ba27-f26204e812a2	54	214	f	1
f104307e-d52f-4e64-8e4e-215baeeb8cac	09533b6c-1ede-495f-ba27-f26204e812a2	69	274	f	1
be5d3ebb-e7e9-4c94-b7de-8045c0f9045e	09533b6c-1ede-495f-ba27-f26204e812a2	44	173	t	1
f4162e5a-d75d-42c0-a91b-6337b219a9bb	09533b6c-1ede-495f-ba27-f26204e812a2	87	346	f	1
005d955e-f7ab-4eca-883a-2e0fa6e6088c	09533b6c-1ede-495f-ba27-f26204e812a2	83	332	f	1
96531d13-ec7c-4160-940e-266f17435d66	09533b6c-1ede-495f-ba27-f26204e812a2	58	230	f	1
a3f21a3c-9fb4-4370-bdee-c9993d54a42b	35ee3bc4-71fa-4f62-ac2f-8d50bb6b12e2	48	190	f	2
8113fbae-e794-439d-9eec-b131a5942004	35ee3bc4-71fa-4f62-ac2f-8d50bb6b12e2	37	148	f	2
93286644-7e20-4967-811e-09c3ab494ca4	35ee3bc4-71fa-4f62-ac2f-8d50bb6b12e2	56	221	t	2
73d36fd4-9735-4304-b662-1a04f7b08a25	35ee3bc4-71fa-4f62-ac2f-8d50bb6b12e2	53	210	f	1
ad7b837b-251a-4394-b980-62275aa47b09	35ee3bc4-71fa-4f62-ac2f-8d50bb6b12e2	39	153	t	1
322bf7b4-c04d-44bc-b9c6-2536f1970de6	35ee3bc4-71fa-4f62-ac2f-8d50bb6b12e2	38	149	t	1
6f2cd383-f71c-4e32-be78-f6df2da408e3	35ee3bc4-71fa-4f62-ac2f-8d50bb6b12e2	42	165	t	1
157029ad-7f48-4272-b53e-2b19c010a29e	35ee3bc4-71fa-4f62-ac2f-8d50bb6b12e2	54	214	f	3
\.


--
-- Data for Name: resultados_evaluacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resultados_evaluacion (evaluacion_id, nota, puntaje_logro, num_aciertos, num_errores, num_aciertos_consecutivos, num_errores_consecutivos, tiempo_promedio_respuesta, indice_desempeno, dificultad_actual, accion_adaptativa, mensaje_adaptativo) FROM stdin;
6635083f-511d-4485-b1e6-036fa3bee758	100	100	5	0	5	0	17	0.672	dificil	subir	¡Excelente trabajo! Avanzamos al siguiente nivel de dificultad.
b1b0c121-c53a-4ceb-aee2-295fc2475469	80	50	4	1	4	1	19	0.488	dificil	subir	¡Excelente trabajo! Avanzamos al siguiente nivel de dificultad.
4f50ddf8-1831-4046-9487-67dd79bba1cf	25	0	1	3	1	3	53	-0.048	normal	bajar	Sigamos practicando en este nivel para afianzar lo aprendido.
c6b7f6e0-81fc-413a-8504-81d1ce58d810	50	10	2	2	1	1	3	0.215	dificil	mantener	Buen trabajo, continuemos practicando en este nivel.
d6fa57a5-f232-4b76-bed7-13009db1d664	60	25	3	2	2	2	8	0.267	normal	mantener	Buen trabajo, continuemos practicando en este nivel.
8605b2f4-647b-4ec9-9429-4ee2a44416f2	63	25	5	3	3	2	2	0.349	normal	mantener	Buen trabajo, continuemos practicando en este nivel.
63021aae-f845-4170-8ed9-3b15455f6fca	50	10	4	4	4	3	1	0.318	facil	bajar	Sigamos practicando en este nivel para afianzar lo aprendido.
09533b6c-1ede-495f-ba27-f26204e812a2	13	0	1	7	1	4	1	-0.050	muy_facil	bajar	Sigamos practicando en este nivel para afianzar lo aprendido.
35ee3bc4-71fa-4f62-ac2f-8d50bb6b12e2	50	10	4	4	3	2	2	0.297	muy_facil	mantener	Buen trabajo, continuemos practicando en este nivel.
\.


--
-- Data for Name: temas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.temas (id, nombre, curso_id, grado) FROM stdin;
1	Fracciones equivalentes	1	4
2	Multiplicación de naturales	1	4
3	Suma y resta de fracciones	1	5
4	Operaciones con decimales	1	5
17	El Tahuantinsuyo	5	5
\.


--
-- Data for Name: usuario_logros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuario_logros (usuario_id, logro_id, obtenido_en, evaluacion_id) FROM stdin;
a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	b14a49d9-e220-498c-bdbb-0cff10fc10a3	2026-05-13 14:53:57.127317+00	6635083f-511d-4485-b1e6-036fa3bee758
a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	6087d740-f9d5-4cbd-aaa4-896cdf3ad4ab	2026-05-13 14:53:57.127317+00	6635083f-511d-4485-b1e6-036fa3bee758
a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	bdfa64c9-e139-4779-a299-ef3227069ead	2026-05-13 14:53:57.127317+00	6635083f-511d-4485-b1e6-036fa3bee758
a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	db7a82d9-07d2-466e-a3ce-78d5d6875716	2026-05-13 14:53:57.127317+00	6635083f-511d-4485-b1e6-036fa3bee758
a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	2e43ca14-d0df-478f-a4fe-82394d3e30a1	2026-05-13 14:53:57.127317+00	6635083f-511d-4485-b1e6-036fa3bee758
599acc4f-badf-41d2-a87d-a336f82b0241	b14a49d9-e220-498c-bdbb-0cff10fc10a3	2026-05-13 18:46:20.490149+00	b1b0c121-c53a-4ceb-aee2-295fc2475469
599acc4f-badf-41d2-a87d-a336f82b0241	bdfa64c9-e139-4779-a299-ef3227069ead	2026-05-13 18:46:20.490149+00	b1b0c121-c53a-4ceb-aee2-295fc2475469
599acc4f-badf-41d2-a87d-a336f82b0241	2e43ca14-d0df-478f-a4fe-82394d3e30a1	2026-05-13 18:46:20.490149+00	b1b0c121-c53a-4ceb-aee2-295fc2475469
a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	980d4d60-7893-4ac6-8c5d-fdbe1af454d1	2026-06-11 23:23:20.515415+00	09533b6c-1ede-495f-ba27-f26204e812a2
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nombre, codigo, password_hash, rol, estado, creado_en) FROM stdin;
a06eb7c6-2a64-490e-a2ef-dfb9cf1fcc87	Valeria Torres Rojas	VAL001	$2b$10$T4dKHYHeZ534CmpUtEozqeXGd.hClpcRqMEFRyrS.bixAzYAONQJO	estudiante	activo	2026-05-13 09:56:47.670798+00
599acc4f-badf-41d2-a87d-a336f82b0241	Diego Salazar Mamani	DIE002	$2b$10$y0y3CZOtGjPMh3iQm3jp5.1JTXIXAiE/0XTd1LLGhNQKOldRwr2Ra	estudiante	activo	2026-05-13 09:56:47.735176+00
66502d9d-99c6-40a9-8c0b-083aa8f4a715	Luciana Rojas Castillo	LUC003	$2b$10$FDpBw48PfneZ7jYuje8VnOCrfwWUSPo8DQYNirlcJfaDs4oZjKGDO	estudiante	activo	2026-05-13 09:56:47.797819+00
84646229-6b20-419a-8b53-ec0afd01a9f6	Mateo Quispe Vargas	MAT004	$2b$10$JQEyqVjKyqCY4M8VJ/Vcr.eIunkS8K06fWQZ4B9uoWZEQQir6wSOi	estudiante	activo	2026-05-13 09:56:47.860598+00
7cbbaa00-6a57-4d3e-8333-3c84756d9df9	Camila Huamán Flores	CAM005	$2b$10$HlyRlH69WUPj1JSp6cseSeA/YIUYPZm57icS3QPf2v5/tmINeihe.	estudiante	activo	2026-05-13 09:56:47.923973+00
\.


--
-- Name: cursos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cursos_id_seq', 5, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 1, true);


--
-- Name: opciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.opciones_id_seq', 524, true);


--
-- Name: preguntas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.preguntas_id_seq', 131, true);


--
-- Name: temas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.temas_id_seq', 17, true);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: cursos cursos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_nombre_key UNIQUE (nombre);


--
-- Name: cursos cursos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_pkey PRIMARY KEY (id);


--
-- Name: evaluaciones evaluaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_pkey PRIMARY KEY (id);


--
-- Name: logros logros_criterio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logros
    ADD CONSTRAINT logros_criterio_key UNIQUE (criterio);


--
-- Name: logros logros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logros
    ADD CONSTRAINT logros_pkey PRIMARY KEY (id);


--
-- Name: opciones opciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opciones
    ADD CONSTRAINT opciones_pkey PRIMARY KEY (id);


--
-- Name: preguntas preguntas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_pkey PRIMARY KEY (id);


--
-- Name: puntos_curso puntos_curso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_curso
    ADD CONSTRAINT puntos_curso_pkey PRIMARY KEY (id);


--
-- Name: puntos_curso puntos_curso_usuario_id_curso_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_curso
    ADD CONSTRAINT puntos_curso_usuario_id_curso_id_key UNIQUE (usuario_id, curso_id);


--
-- Name: respuestas_evaluacion respuestas_evaluacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respuestas_evaluacion
    ADD CONSTRAINT respuestas_evaluacion_pkey PRIMARY KEY (id);


--
-- Name: resultados_evaluacion resultados_evaluacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados_evaluacion
    ADD CONSTRAINT resultados_evaluacion_pkey PRIMARY KEY (evaluacion_id);


--
-- Name: temas temas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temas
    ADD CONSTRAINT temas_pkey PRIMARY KEY (id);


--
-- Name: usuario_logros usuario_logros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_logros
    ADD CONSTRAINT usuario_logros_pkey PRIMARY KEY (usuario_id, logro_id);


--
-- Name: usuarios usuarios_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_codigo_key UNIQUE (codigo);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: idx_evaluaciones_creado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evaluaciones_creado ON public.evaluaciones USING btree (creado_en);


--
-- Name: idx_evaluaciones_finalizado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evaluaciones_finalizado ON public.evaluaciones USING btree (finalizado_en) WHERE (finalizado_en IS NOT NULL);


--
-- Name: idx_evaluaciones_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evaluaciones_usuario ON public.evaluaciones USING btree (usuario_id);


--
-- Name: idx_opciones_pregunta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opciones_pregunta ON public.opciones USING btree (pregunta_id);


--
-- Name: idx_preguntas_curso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preguntas_curso ON public.preguntas USING btree (curso_id);


--
-- Name: idx_preguntas_dificultad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preguntas_dificultad ON public.preguntas USING btree (dificultad);


--
-- Name: idx_preguntas_tema; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preguntas_tema ON public.preguntas USING btree (tema_id);


--
-- Name: idx_puntos_curso_curso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_puntos_curso_curso ON public.puntos_curso USING btree (curso_id);


--
-- Name: idx_puntos_curso_puntos; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_puntos_curso_puntos ON public.puntos_curso USING btree (curso_id, puntos_total DESC);


--
-- Name: idx_respuestas_evaluacion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respuestas_evaluacion ON public.respuestas_evaluacion USING btree (evaluacion_id);


--
-- Name: idx_temas_curso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temas_curso ON public.temas USING btree (curso_id);


--
-- Name: idx_temas_curso_grado_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_temas_curso_grado_nombre ON public.temas USING btree (curso_id, grado, nombre);


--
-- Name: idx_temas_grado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temas_grado ON public.temas USING btree (grado);


--
-- Name: idx_usuario_logros_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuario_logros_usuario ON public.usuario_logros USING btree (usuario_id);


--
-- Name: idx_usuarios_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_codigo ON public.usuarios USING btree (codigo);


--
-- Name: idx_usuarios_rol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol);


--
-- Name: evaluaciones evaluaciones_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id);


--
-- Name: evaluaciones evaluaciones_tema_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.temas(id);


--
-- Name: evaluaciones evaluaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: opciones opciones_pregunta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opciones
    ADD CONSTRAINT opciones_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.preguntas(id) ON DELETE CASCADE;


--
-- Name: preguntas preguntas_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;


--
-- Name: preguntas preguntas_tema_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.temas(id) ON DELETE CASCADE;


--
-- Name: puntos_curso puntos_curso_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_curso
    ADD CONSTRAINT puntos_curso_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;


--
-- Name: puntos_curso puntos_curso_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.puntos_curso
    ADD CONSTRAINT puntos_curso_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: respuestas_evaluacion respuestas_evaluacion_evaluacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respuestas_evaluacion
    ADD CONSTRAINT respuestas_evaluacion_evaluacion_id_fkey FOREIGN KEY (evaluacion_id) REFERENCES public.evaluaciones(id) ON DELETE CASCADE;


--
-- Name: respuestas_evaluacion respuestas_evaluacion_opcion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respuestas_evaluacion
    ADD CONSTRAINT respuestas_evaluacion_opcion_id_fkey FOREIGN KEY (opcion_id) REFERENCES public.opciones(id);


--
-- Name: respuestas_evaluacion respuestas_evaluacion_pregunta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respuestas_evaluacion
    ADD CONSTRAINT respuestas_evaluacion_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.preguntas(id);


--
-- Name: resultados_evaluacion resultados_evaluacion_evaluacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resultados_evaluacion
    ADD CONSTRAINT resultados_evaluacion_evaluacion_id_fkey FOREIGN KEY (evaluacion_id) REFERENCES public.evaluaciones(id) ON DELETE CASCADE;


--
-- Name: temas temas_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temas
    ADD CONSTRAINT temas_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;


--
-- Name: usuario_logros usuario_logros_evaluacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_logros
    ADD CONSTRAINT usuario_logros_evaluacion_id_fkey FOREIGN KEY (evaluacion_id) REFERENCES public.evaluaciones(id) ON DELETE SET NULL;


--
-- Name: usuario_logros usuario_logros_logro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_logros
    ADD CONSTRAINT usuario_logros_logro_id_fkey FOREIGN KEY (logro_id) REFERENCES public.logros(id) ON DELETE CASCADE;


--
-- Name: usuario_logros usuario_logros_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_logros
    ADD CONSTRAINT usuario_logros_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vKWKFCPL1Ye8ivFq11JnC6Q6vJqixpb3HeiiuDwzc8NiNEeXTcFMAvnChBe2ecn

