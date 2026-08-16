--
-- PostgreSQL database dump
--

\restrict lkQszvziiUAqWXLapVqupXXPZFcjKWW1GWNoSOBGmXkoB2eXqdApdQN3uQaekeS

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, password, created_at, reset_token, reset_expires) FROM stdin;
113a9ba6-191a-416a-accf-12c1d4174b39	test@example.com	testuser	$2a$12$vSxjpAGtvzGHWrvQhUWV8.jc2.3b9URMlFX6hMy7d/TcUGE9jPbjW	2026-08-15 09:41:32.85348+07	\N	\N
1d86aaaf-f1ba-43c5-806d-d67d91b6431c	frankovic.fnk@gmail.com	frankovic	$2a$12$np0Tl6dlHHD9KYMjVtvu4OEMgQdwlO/2lcwO3eA9TsfBVbUAUnLq6	2026-08-15 10:11:45.010744+07	\N	\N
85e528ff-b2b7-4290-94df-bac6605f84ab	por@mail.com	porpor	$2a$12$0h5aVGVcuhA4bmzgFzyjBeRc7ub9Pjm1/gZf2QZwwcqLg6Fz6f9Ee	2026-08-15 14:19:43.428779+07	\N	\N
\.


--
-- Data for Name: export_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.export_logs (id, user_id, mode, exported_at) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (user_id, plan, expires_at, updated_at) FROM stdin;
113a9ba6-191a-416a-accf-12c1d4174b39	full_pro	2026-08-22 09:41:32.85348+07	2026-08-15 09:41:32.85348+07
85e528ff-b2b7-4290-94df-bac6605f84ab	full_pro	2026-08-22 14:19:43.428779+07	2026-08-15 14:19:43.428779+07
1d86aaaf-f1ba-43c5-806d-d67d91b6431c	full_pro	2027-08-15 14:43:26.923+07	2026-08-15 14:43:26.924145+07
\.


--
-- Name: export_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.export_logs_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict lkQszvziiUAqWXLapVqupXXPZFcjKWW1GWNoSOBGmXkoB2eXqdApdQN3uQaekeS

