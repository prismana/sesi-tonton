--
-- PostgreSQL database dump
--

\restrict IPjF3IhQOlrSRzE2xAODYPCId26ZA1fnEaEONr6OR5JEdJJ8izywIp8dleCq4pS

-- Dumped from database version 16.16
-- Dumped by pg_dump version 16.16

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.videos DROP CONSTRAINT IF EXISTS videos_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.video_requests DROP CONSTRAINT IF EXISTS video_requests_video_id_fkey;
ALTER TABLE IF EXISTS ONLY public.video_requests DROP CONSTRAINT IF EXISTS video_requests_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.video_requests DROP CONSTRAINT IF EXISTS video_requests_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.access_logs DROP CONSTRAINT IF EXISTS access_logs_video_id_fkey;
ALTER TABLE IF EXISTS ONLY public.access_logs DROP CONSTRAINT IF EXISTS access_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.access_logs DROP CONSTRAINT IF EXISTS access_logs_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.videos DROP CONSTRAINT IF EXISTS videos_pkey;
ALTER TABLE IF EXISTS ONLY public.video_requests DROP CONSTRAINT IF EXISTS video_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.access_logs DROP CONSTRAINT IF EXISTS access_logs_pkey;
ALTER TABLE IF EXISTS public.videos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.video_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.access_logs ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.videos_id_seq;
DROP TABLE IF EXISTS public.videos;
DROP SEQUENCE IF EXISTS public.video_requests_id_seq;
DROP TABLE IF EXISTS public.video_requests;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.access_logs_id_seq;
DROP TABLE IF EXISTS public.access_logs;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.access_logs (
    id integer NOT NULL,
    request_id integer NOT NULL,
    user_id integer NOT NULL,
    video_id integer NOT NULL,
    watched_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.access_logs OWNER TO postgres;

--
-- Name: access_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.access_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.access_logs_id_seq OWNER TO postgres;

--
-- Name: access_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.access_logs_id_seq OWNED BY public.access_logs.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'customer'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: video_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    video_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    approved_by integer,
    expires_at timestamp with time zone,
    requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT video_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'expired'::character varying])::text[])))
);


ALTER TABLE public.video_requests OWNER TO postgres;

--
-- Name: video_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.video_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.video_requests_id_seq OWNER TO postgres;

--
-- Name: video_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_requests_id_seq OWNED BY public.video_requests.id;


--
-- Name: videos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.videos (
    id integer NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    file_path character varying(255) NOT NULL,
    uploaded_by integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.videos OWNER TO postgres;

--
-- Name: videos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.videos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.videos_id_seq OWNER TO postgres;

--
-- Name: videos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.videos_id_seq OWNED BY public.videos.id;


--
-- Name: access_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_logs ALTER COLUMN id SET DEFAULT nextval('public.access_logs_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: video_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_requests ALTER COLUMN id SET DEFAULT nextval('public.video_requests_id_seq'::regclass);


--
-- Name: videos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos ALTER COLUMN id SET DEFAULT nextval('public.videos_id_seq'::regclass);


--
-- Data for Name: access_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.access_logs (id, request_id, user_id, video_id, watched_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, username, password_hash, role, created_at) FROM stdin;
3	Super Admin	admin	$2b$10$mydP2.qM0H5Em8dIXb1FeeM8ehjnqDuJPpG4yBC6tXTtGiXuE3jd.	admin	2026-11-18 15:44:00.692682+00
4	Budi Sudarman	budi	$2b$10$mydP2.qM0H5Em8dIXb1FeeM8ehjnqDuJPpG4yBC6tXTtGiXuE3jd.	customer	2026-11-18 15:44:00.692682+00
6	Edi Kanuya	edi	$2b$10$UM1IDA3yQjoM/FNVU2PPEOvgRd5KMdwCbQS/4xf9Bnvqv1KDkc1A6	customer	2026-11-19 06:43:34.096135+00
\.


--
-- Data for Name: video_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_requests (id, user_id, video_id, status, approved_by, expires_at, requested_at) FROM stdin;
4	4	2	rejected	3	\N	2026-11-19 08:04:40.854128+00
\.


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.videos (id, title, description, file_path, uploaded_by, created_at) FROM stdin;
2	video 1 	video tentang anak kepiting	video-1795075401421-139756739.webm	3	2026-11-19 08:03:21.433131+00
3	video linux	Cara mengoperasikan linux	video-1795075584809-197161476.webm	3	2026-11-19 08:06:24.818082+00
\.


--
-- Name: access_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.access_logs_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: video_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_requests_id_seq', 4, true);


--
-- Name: videos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.videos_id_seq', 3, true);


--
-- Name: access_logs access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: video_requests video_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_requests
    ADD CONSTRAINT video_requests_pkey PRIMARY KEY (id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: access_logs access_logs_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.video_requests(id) ON DELETE CASCADE;


--
-- Name: access_logs access_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: access_logs access_logs_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;


--
-- Name: video_requests video_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_requests
    ADD CONSTRAINT video_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: video_requests video_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_requests
    ADD CONSTRAINT video_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: video_requests video_requests_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_requests
    ADD CONSTRAINT video_requests_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE;


--
-- Name: videos videos_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict IPjF3IhQOlrSRzE2xAODYPCId26ZA1fnEaEONr6OR5JEdJJ8izywIp8dleCq4pS

