--
-- PostgreSQL database dump
--

\restrict QKHyGH1p7sITCnwm5w3jh0KgXDXGNkcegfjfXa86gI6J6RndEq9cNhzFrzbHaQO

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-25 14:19:37

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 235 (class 1259 OID 16576)
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."AuditLog" (
    id integer NOT NULL,
    "adminId" integer NOT NULL,
    action text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" integer NOT NULL,
    details jsonb,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO "user";

--
-- TOC entry 234 (class 1259 OID 16575)
-- Name: AuditLog_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."AuditLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."AuditLog_id_seq" OWNER TO "user";

--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 234
-- Name: AuditLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."AuditLog_id_seq" OWNED BY public."AuditLog".id;


--
-- TOC entry 241 (class 1259 OID 16650)
-- Name: Block; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Block" (
    id integer NOT NULL,
    "blockerId" integer NOT NULL,
    "blockedUserId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Block" OWNER TO "user";

--
-- TOC entry 240 (class 1259 OID 16649)
-- Name: Block_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Block_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Block_id_seq" OWNER TO "user";

--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 240
-- Name: Block_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Block_id_seq" OWNED BY public."Block".id;


--
-- TOC entry 228 (class 1259 OID 16459)
-- Name: ChatRoom; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."ChatRoom" (
    id integer NOT NULL,
    "requestId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChatRoom" OWNER TO "user";

--
-- TOC entry 227 (class 1259 OID 16458)
-- Name: ChatRoom_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."ChatRoom_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatRoom_id_seq" OWNER TO "user";

--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 227
-- Name: ChatRoom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."ChatRoom_id_seq" OWNED BY public."ChatRoom".id;


--
-- TOC entry 239 (class 1259 OID 16632)
-- Name: Complaint; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Complaint" (
    id integer NOT NULL,
    "reporterId" integer NOT NULL,
    "targetUserId" integer NOT NULL,
    reason text NOT NULL,
    details text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Complaint" OWNER TO "user";

--
-- TOC entry 238 (class 1259 OID 16631)
-- Name: Complaint_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Complaint_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Complaint_id_seq" OWNER TO "user";

--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 238
-- Name: Complaint_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Complaint_id_seq" OWNED BY public."Complaint".id;


--
-- TOC entry 233 (class 1259 OID 16556)
-- Name: CsTicket; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."CsTicket" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "requestId" integer,
    "handlerId" integer,
    subject text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    priority text DEFAULT 'MEDIUM'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CsTicket" OWNER TO "user";

--
-- TOC entry 232 (class 1259 OID 16555)
-- Name: CsTicket_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."CsTicket_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."CsTicket_id_seq" OWNER TO "user";

--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 232
-- Name: CsTicket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."CsTicket_id_seq" OWNED BY public."CsTicket".id;


--
-- TOC entry 230 (class 1259 OID 16470)
-- Name: Message; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Message" (
    id integer NOT NULL,
    "chatRoomId" integer NOT NULL,
    "senderId" integer NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Message" OWNER TO "user";

--
-- TOC entry 229 (class 1259 OID 16469)
-- Name: Message_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Message_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Message_id_seq" OWNER TO "user";

--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 229
-- Name: Message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Message_id_seq" OWNED BY public."Message".id;


--
-- TOC entry 224 (class 1259 OID 16425)
-- Name: Report; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Report" (
    id integer NOT NULL,
    "requestId" integer NOT NULL,
    "reporterId" integer NOT NULL,
    description text NOT NULL,
    images text[],
    location text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "capturedAt" timestamp(3) without time zone,
    latitude double precision,
    longitude double precision,
    metadata jsonb,
    "verificationScore" double precision,
    "aiScore" double precision
);


ALTER TABLE public."Report" OWNER TO "user";

--
-- TOC entry 223 (class 1259 OID 16424)
-- Name: Report_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Report_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Report_id_seq" OWNER TO "user";

--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 223
-- Name: Report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Report_id_seq" OWNED BY public."Report".id;


--
-- TOC entry 222 (class 1259 OID 16404)
-- Name: Request; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Request" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    category text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "rewardAmount" numeric(65,30) NOT NULL,
    "depositAmount" numeric(65,30) NOT NULL,
    location text NOT NULL,
    latitude double precision,
    longitude double precision,
    status text DEFAULT 'OPEN'::text NOT NULL,
    images text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb
);


ALTER TABLE public."Request" OWNER TO "user";

--
-- TOC entry 221 (class 1259 OID 16403)
-- Name: Request_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Request_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Request_id_seq" OWNER TO "user";

--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 221
-- Name: Request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Request_id_seq" OWNED BY public."Request".id;


--
-- TOC entry 237 (class 1259 OID 16616)
-- Name: Review; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Review" (
    id integer NOT NULL,
    "requestId" integer NOT NULL,
    "authorId" integer NOT NULL,
    "targetUserId" integer NOT NULL,
    rating integer NOT NULL,
    content text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Review" OWNER TO "user";

--
-- TOC entry 236 (class 1259 OID 16615)
-- Name: Review_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Review_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Review_id_seq" OWNER TO "user";

--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 236
-- Name: Review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Review_id_seq" OWNED BY public."Review".id;


--
-- TOC entry 226 (class 1259 OID 16443)
-- Name: Transaction; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Transaction" (
    id integer NOT NULL,
    "requestId" integer,
    "reportId" integer,
    "userId" integer NOT NULL,
    amount numeric(65,30) NOT NULL,
    type text NOT NULL,
    status text NOT NULL,
    imp_uid text,
    merchant_uid text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "auditLogId" integer
);


ALTER TABLE public."Transaction" OWNER TO "user";

--
-- TOC entry 225 (class 1259 OID 16442)
-- Name: Transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."Transaction_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Transaction_id_seq" OWNER TO "user";

--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 225
-- Name: Transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."Transaction_id_seq" OWNED BY public."Transaction".id;


--
-- TOC entry 220 (class 1259 OID 16389)
-- Name: User; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    phone text,
    "profileImage" text,
    "pushToken" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text DEFAULT 'USER'::text NOT NULL,
    "identityStatus" text DEFAULT 'UNVERIFIED'::text NOT NULL,
    rating double precision DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."User" OWNER TO "user";

--
-- TOC entry 219 (class 1259 OID 16388)
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO "user";

--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 219
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- TOC entry 231 (class 1259 OID 16486)
-- Name: _ChatRoomToUser; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."_ChatRoomToUser" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_ChatRoomToUser" OWNER TO "user";

--
-- TOC entry 4933 (class 2604 OID 16579)
-- Name: AuditLog id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AuditLog" ALTER COLUMN id SET DEFAULT nextval('public."AuditLog_id_seq"'::regclass);


--
-- TOC entry 4940 (class 2604 OID 16653)
-- Name: Block id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Block" ALTER COLUMN id SET DEFAULT nextval('public."Block_id_seq"'::regclass);


--
-- TOC entry 4924 (class 2604 OID 16462)
-- Name: ChatRoom id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChatRoom" ALTER COLUMN id SET DEFAULT nextval('public."ChatRoom_id_seq"'::regclass);


--
-- TOC entry 4937 (class 2604 OID 16635)
-- Name: Complaint id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Complaint" ALTER COLUMN id SET DEFAULT nextval('public."Complaint_id_seq"'::regclass);


--
-- TOC entry 4929 (class 2604 OID 16559)
-- Name: CsTicket id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."CsTicket" ALTER COLUMN id SET DEFAULT nextval('public."CsTicket_id_seq"'::regclass);


--
-- TOC entry 4926 (class 2604 OID 16473)
-- Name: Message id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Message" ALTER COLUMN id SET DEFAULT nextval('public."Message_id_seq"'::regclass);


--
-- TOC entry 4919 (class 2604 OID 16428)
-- Name: Report id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Report" ALTER COLUMN id SET DEFAULT nextval('public."Report_id_seq"'::regclass);


--
-- TOC entry 4916 (class 2604 OID 16407)
-- Name: Request id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Request" ALTER COLUMN id SET DEFAULT nextval('public."Request_id_seq"'::regclass);


--
-- TOC entry 4935 (class 2604 OID 16619)
-- Name: Review id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Review" ALTER COLUMN id SET DEFAULT nextval('public."Review_id_seq"'::regclass);


--
-- TOC entry 4922 (class 2604 OID 16446)
-- Name: Transaction id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Transaction" ALTER COLUMN id SET DEFAULT nextval('public."Transaction_id_seq"'::regclass);


--
-- TOC entry 4910 (class 2604 OID 16392)
-- Name: User id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- TOC entry 5154 (class 0 OID 16576)
-- Dependencies: 235
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."AuditLog" (id, "adminId", action, "targetType", "targetId", details, "ipAddress", "createdAt") FROM stdin;
1	1	BULK_DELETE_REQUESTS	Request	0	{"ids": [8, 7], "deletedCount": 2}	\N	2025-12-18 12:58:54.976
\.


--
-- TOC entry 5160 (class 0 OID 16650)
-- Dependencies: 241
-- Data for Name: Block; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Block" (id, "blockerId", "blockedUserId", "createdAt") FROM stdin;
\.


--
-- TOC entry 5147 (class 0 OID 16459)
-- Dependencies: 228
-- Data for Name: ChatRoom; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."ChatRoom" (id, "requestId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5158 (class 0 OID 16632)
-- Dependencies: 239
-- Data for Name: Complaint; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Complaint" (id, "reporterId", "targetUserId", reason, details, status, "createdAt") FROM stdin;
\.


--
-- TOC entry 5152 (class 0 OID 16556)
-- Dependencies: 233
-- Data for Name: CsTicket; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."CsTicket" (id, "userId", "requestId", "handlerId", subject, content, status, priority, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5149 (class 0 OID 16470)
-- Dependencies: 230
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Message" (id, "chatRoomId", "senderId", content, read, "createdAt") FROM stdin;
\.


--
-- TOC entry 5143 (class 0 OID 16425)
-- Dependencies: 224
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Report" (id, "requestId", "reporterId", description, images, location, status, "createdAt", "capturedAt", latitude, longitude, metadata, "verificationScore", "aiScore") FROM stdin;
\.


--
-- TOC entry 5141 (class 0 OID 16404)
-- Dependencies: 222
-- Data for Name: Request; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Request" (id, "userId", category, title, description, "rewardAmount", "depositAmount", location, latitude, longitude, status, images, "createdAt", metadata) FROM stdin;
1	1	LOST	실제 분실물 테스트	이것은 실제 백엔드에서 가져온 상세 내용입니다. 아주 상세하죠?	10000.000000000000000000000000000000	5000.000000000000000000000000000000	서울시 강남구	\N	\N	OPEN	\N	2025-12-18 02:48:44.482	\N
2	1	LOST	즉시 등록 테스트 (의뢰)	[분실물 의뢰]\n분실 일시: 2025-12-18 18:54\n\n관리자 승인 없이 즉시 등록되는지 확인용입니다.	50000.000000000000000000000000000000	50000.000000000000000000000000000000	강남역	\N	\N	OPEN	{}	2025-12-18 09:55:27.886	\N
3	1	LOST	ㅣ	[분실물 의뢰]\n분실 일시: 2025-12-18 20:50\n\nㅣ	10000000.000000000000000000000000000000	1000000.000000000000000000000000000000	ㅣ	\N	\N	OPEN	{}	2025-12-18 11:51:08.608	\N
4	1	LOST	kkkkkkkkkk	[분실물 의뢰]\n분실 일시: 2025-12-18 20:52\n\nkkkkkkkkkkkkkkkkkkk	500000.000000000000000000000000000000	50000.000000000000000000000000000000	kkkkkkkkkkkkk	\N	\N	OPEN	{}	2025-12-18 11:52:35.176	\N
5	3	LOST	이미지 및 모달 테스트	[분실물 의뢰]\n분실 일시: 2025-12-18 20:57\n\n테스트입니다.	50000.000000000000000000000000000000	50000.000000000000000000000000000000	서울	\N	\N	OPEN	{}	2025-12-18 11:57:38.697	\N
6	1	LOST	ㅐㅐㅐㅐㅐㅐ	[분실물 의뢰]\n분실 일시: 2025-12-18 21:02\n\nㅐㅐㅐㅐㅐㅐㅐㅐㅐㅐ	888888.000000000000000000000000000000	88888.000000000000000000000000000000	ㅣㅣㅣㅣㅣㅣㅣㅣ	\N	\N	OPEN	{}	2025-12-18 12:03:23.237	\N
\.


--
-- TOC entry 5156 (class 0 OID 16616)
-- Dependencies: 237
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Review" (id, "requestId", "authorId", "targetUserId", rating, content, "createdAt") FROM stdin;
\.


--
-- TOC entry 5145 (class 0 OID 16443)
-- Dependencies: 226
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Transaction" (id, "requestId", "reportId", "userId", amount, type, status, imp_uid, merchant_uid, "createdAt", "auditLogId") FROM stdin;
\.


--
-- TOC entry 5139 (class 0 OID 16389)
-- Dependencies: 220
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."User" (id, email, "passwordHash", name, phone, "profileImage", "pushToken", "createdAt", role, "identityStatus", rating, "reviewCount") FROM stdin;
2	debug_new@test.com	$2b$10$5ZX2DwVWUTUivAdzngbVletQh/sUCCtzKIdqlkBpcEhHZC6sjnmBC	Debug User	ilikepeople@icloud.com	\N	\N	2025-12-18 11:37:42.345	USER	UNVERIFIED	0	0
3	verified_user@test.com	$2b$10$b6xuWLO/iTkvqmrgMglChO8sPF4aBcL43kslXc/YxY0t5s.v4/CSS	Final Verified User	ilikepeople@icloud.com	\N	\N	2025-12-18 11:40:57.532	USER	UNVERIFIED	0	0
1	ilikepeople@icloud.com	$2b$10$OBUhZ34yRXVrtaZdg0j15.ODa5hWWNJZY2S5c7AR8GKo1z/Gj82Le	신현구	ilikepeople@icloud.com	\N	\N	2025-12-18 02:31:48.476	ADMIN	UNVERIFIED	0	0
4	kakao_4653251412@kakao.user	SOCIAL_LOGIN	Kakao User	\N	\N	\N	2025-12-20 19:50:07.244	USER	UNVERIFIED	0	0
\.


--
-- TOC entry 5150 (class 0 OID 16486)
-- Dependencies: 231
-- Data for Name: _ChatRoomToUser; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."_ChatRoomToUser" ("A", "B") FROM stdin;
\.


--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 234
-- Name: AuditLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."AuditLog_id_seq"', 1, true);


--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 240
-- Name: Block_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Block_id_seq"', 1, false);


--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 227
-- Name: ChatRoom_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."ChatRoom_id_seq"', 1, false);


--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 238
-- Name: Complaint_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Complaint_id_seq"', 1, false);


--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 232
-- Name: CsTicket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."CsTicket_id_seq"', 1, false);


--
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 229
-- Name: Message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Message_id_seq"', 1, false);


--
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 223
-- Name: Report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Report_id_seq"', 1, false);


--
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 221
-- Name: Request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Request_id_seq"', 8, true);


--
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 236
-- Name: Review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Review_id_seq"', 1, false);


--
-- TOC entry 5186 (class 0 OID 0)
-- Dependencies: 225
-- Name: Transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."Transaction_id_seq"', 1, false);


--
-- TOC entry 5187 (class 0 OID 0)
-- Dependencies: 219
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public."User_id_seq"', 4, true);


--
-- TOC entry 4960 (class 2606 OID 16590)
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- TOC entry 4968 (class 2606 OID 16660)
-- Name: Block Block_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_pkey" PRIMARY KEY (id);


--
-- TOC entry 4952 (class 2606 OID 16468)
-- Name: ChatRoom ChatRoom_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChatRoom"
    ADD CONSTRAINT "ChatRoom_pkey" PRIMARY KEY (id);


--
-- TOC entry 4965 (class 2606 OID 16648)
-- Name: Complaint Complaint_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_pkey" PRIMARY KEY (id);


--
-- TOC entry 4958 (class 2606 OID 16574)
-- Name: CsTicket CsTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."CsTicket"
    ADD CONSTRAINT "CsTicket_pkey" PRIMARY KEY (id);


--
-- TOC entry 4954 (class 2606 OID 16485)
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- TOC entry 4948 (class 2606 OID 16441)
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- TOC entry 4946 (class 2606 OID 16423)
-- Name: Request Request_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_pkey" PRIMARY KEY (id);


--
-- TOC entry 4962 (class 2606 OID 16630)
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- TOC entry 4950 (class 2606 OID 16457)
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- TOC entry 4944 (class 2606 OID 16402)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 4966 (class 1259 OID 16662)
-- Name: Block_blockerId_blockedUserId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Block_blockerId_blockedUserId_key" ON public."Block" USING btree ("blockerId", "blockedUserId");


--
-- TOC entry 4963 (class 1259 OID 16661)
-- Name: Review_requestId_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "Review_requestId_key" ON public."Review" USING btree ("requestId");


--
-- TOC entry 4942 (class 1259 OID 16491)
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- TOC entry 4955 (class 1259 OID 16492)
-- Name: _ChatRoomToUser_AB_unique; Type: INDEX; Schema: public; Owner: user
--

CREATE UNIQUE INDEX "_ChatRoomToUser_AB_unique" ON public."_ChatRoomToUser" USING btree ("A", "B");


--
-- TOC entry 4956 (class 1259 OID 16493)
-- Name: _ChatRoomToUser_B_index; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX "_ChatRoomToUser_B_index" ON public."_ChatRoomToUser" USING btree ("B");


--
-- TOC entry 4983 (class 2606 OID 16606)
-- Name: AuditLog AuditLog_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4989 (class 2606 OID 16693)
-- Name: Block Block_blockedUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4990 (class 2606 OID 16688)
-- Name: Block Block_blockerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4975 (class 2606 OID 16524)
-- Name: ChatRoom ChatRoom_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."ChatRoom"
    ADD CONSTRAINT "ChatRoom_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4987 (class 2606 OID 16678)
-- Name: Complaint Complaint_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4988 (class 2606 OID 16683)
-- Name: Complaint Complaint_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4980 (class 2606 OID 16601)
-- Name: CsTicket CsTicket_handlerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."CsTicket"
    ADD CONSTRAINT "CsTicket_handlerId_fkey" FOREIGN KEY ("handlerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4981 (class 2606 OID 16596)
-- Name: CsTicket CsTicket_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."CsTicket"
    ADD CONSTRAINT "CsTicket_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4982 (class 2606 OID 16591)
-- Name: CsTicket CsTicket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."CsTicket"
    ADD CONSTRAINT "CsTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4976 (class 2606 OID 16529)
-- Name: Message Message_chatRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES public."ChatRoom"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4977 (class 2606 OID 16534)
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4970 (class 2606 OID 16504)
-- Name: Report Report_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4971 (class 2606 OID 16499)
-- Name: Report Report_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4969 (class 2606 OID 16494)
-- Name: Request Request_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4984 (class 2606 OID 16668)
-- Name: Review Review_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4985 (class 2606 OID 16663)
-- Name: Review Review_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4986 (class 2606 OID 16673)
-- Name: Review Review_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4972 (class 2606 OID 16514)
-- Name: Transaction Transaction_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."Report"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4973 (class 2606 OID 16509)
-- Name: Transaction Transaction_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 4974 (class 2606 OID 16519)
-- Name: Transaction Transaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4978 (class 2606 OID 16539)
-- Name: _ChatRoomToUser _ChatRoomToUser_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."_ChatRoomToUser"
    ADD CONSTRAINT "_ChatRoomToUser_A_fkey" FOREIGN KEY ("A") REFERENCES public."ChatRoom"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 4979 (class 2606 OID 16544)
-- Name: _ChatRoomToUser _ChatRoomToUser_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."_ChatRoomToUser"
    ADD CONSTRAINT "_ChatRoomToUser_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2025-12-25 14:19:38

--
-- PostgreSQL database dump complete
--

\unrestrict QKHyGH1p7sITCnwm5w3jh0KgXDXGNkcegfjfXa86gI6J6RndEq9cNhzFrzbHaQO

