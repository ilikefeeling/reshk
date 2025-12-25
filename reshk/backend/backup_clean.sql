--
-- PostgreSQL database dump
--

\restrict ExZpgIKRm6RwkfoZeVF5R4JfoBx7krAH7lbLHhoZoGghUjSy91ezXEw84kWwwxc

-- Dumped from database version 18.1
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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: AuditLog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."AuditLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: AuditLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."AuditLog_id_seq" OWNED BY public."AuditLog".id;


--
-- Name: Block; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Block" (
    id integer NOT NULL,
    "blockerId" integer NOT NULL,
    "blockedUserId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Block_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Block_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Block_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Block_id_seq" OWNED BY public."Block".id;


--
-- Name: ChatRoom; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChatRoom" (
    id integer NOT NULL,
    "requestId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ChatRoom_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ChatRoom_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ChatRoom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ChatRoom_id_seq" OWNED BY public."ChatRoom".id;


--
-- Name: Complaint; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Complaint_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Complaint_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Complaint_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Complaint_id_seq" OWNED BY public."Complaint".id;


--
-- Name: CsTicket; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: CsTicket_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CsTicket_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CsTicket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CsTicket_id_seq" OWNED BY public."CsTicket".id;


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id integer NOT NULL,
    "chatRoomId" integer NOT NULL,
    "senderId" integer NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Message_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Message_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Message_id_seq" OWNED BY public."Message".id;


--
-- Name: Report; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Report_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Report_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Report_id_seq" OWNED BY public."Report".id;


--
-- Name: Request; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Request_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Request_id_seq" OWNED BY public."Request".id;


--
-- Name: Review; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Review_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Review_id_seq" OWNED BY public."Review".id;


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: Transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Transaction_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Transaction_id_seq" OWNED BY public."Transaction".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _ChatRoomToUser; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_ChatRoomToUser" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


--
-- Name: AuditLog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog" ALTER COLUMN id SET DEFAULT nextval('public."AuditLog_id_seq"'::regclass);


--
-- Name: Block id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Block" ALTER COLUMN id SET DEFAULT nextval('public."Block_id_seq"'::regclass);


--
-- Name: ChatRoom id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatRoom" ALTER COLUMN id SET DEFAULT nextval('public."ChatRoom_id_seq"'::regclass);


--
-- Name: Complaint id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Complaint" ALTER COLUMN id SET DEFAULT nextval('public."Complaint_id_seq"'::regclass);


--
-- Name: CsTicket id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CsTicket" ALTER COLUMN id SET DEFAULT nextval('public."CsTicket_id_seq"'::regclass);


--
-- Name: Message id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message" ALTER COLUMN id SET DEFAULT nextval('public."Message_id_seq"'::regclass);


--
-- Name: Report id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report" ALTER COLUMN id SET DEFAULT nextval('public."Report_id_seq"'::regclass);


--
-- Name: Request id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Request" ALTER COLUMN id SET DEFAULT nextval('public."Request_id_seq"'::regclass);


--
-- Name: Review id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review" ALTER COLUMN id SET DEFAULT nextval('public."Review_id_seq"'::regclass);


--
-- Name: Transaction id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction" ALTER COLUMN id SET DEFAULT nextval('public."Transaction_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "adminId", action, "targetType", "targetId", details, "ipAddress", "createdAt") FROM stdin;
1	1	BULK_DELETE_REQUESTS	Request	0	{"ids": [8, 7], "deletedCount": 2}	\N	2025-12-18 12:58:54.976
\.


--
-- Data for Name: Block; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Block" (id, "blockerId", "blockedUserId", "createdAt") FROM stdin;
\.


--
-- Data for Name: ChatRoom; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChatRoom" (id, "requestId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Complaint; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Complaint" (id, "reporterId", "targetUserId", reason, details, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: CsTicket; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CsTicket" (id, "userId", "requestId", "handlerId", subject, content, status, priority, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Message" (id, "chatRoomId", "senderId", content, read, "createdAt") FROM stdin;
\.


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Report" (id, "requestId", "reporterId", description, images, location, status, "createdAt", "capturedAt", latitude, longitude, metadata, "verificationScore", "aiScore") FROM stdin;
\.


--
-- Data for Name: Request; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Review" (id, "requestId", "authorId", "targetUserId", rating, content, "createdAt") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Transaction" (id, "requestId", "reportId", "userId", amount, type, status, imp_uid, merchant_uid, "createdAt", "auditLogId") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, "passwordHash", name, phone, "profileImage", "pushToken", "createdAt", role, "identityStatus", rating, "reviewCount") FROM stdin;
2	debug_new@test.com	$2b$10$5ZX2DwVWUTUivAdzngbVletQh/sUCCtzKIdqlkBpcEhHZC6sjnmBC	Debug User	ilikepeople@icloud.com	\N	\N	2025-12-18 11:37:42.345	USER	UNVERIFIED	0	0
3	verified_user@test.com	$2b$10$b6xuWLO/iTkvqmrgMglChO8sPF4aBcL43kslXc/YxY0t5s.v4/CSS	Final Verified User	ilikepeople@icloud.com	\N	\N	2025-12-18 11:40:57.532	USER	UNVERIFIED	0	0
1	ilikepeople@icloud.com	$2b$10$OBUhZ34yRXVrtaZdg0j15.ODa5hWWNJZY2S5c7AR8GKo1z/Gj82Le	신현구	ilikepeople@icloud.com	\N	\N	2025-12-18 02:31:48.476	ADMIN	UNVERIFIED	0	0
4	kakao_4653251412@kakao.user	SOCIAL_LOGIN	Kakao User	\N	\N	\N	2025-12-20 19:50:07.244	USER	UNVERIFIED	0	0
\.


--
-- Data for Name: _ChatRoomToUser; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_ChatRoomToUser" ("A", "B") FROM stdin;
\.


--
-- Name: AuditLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."AuditLog_id_seq"', 1, true);


--
-- Name: Block_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Block_id_seq"', 1, false);


--
-- Name: ChatRoom_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ChatRoom_id_seq"', 1, false);


--
-- Name: Complaint_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Complaint_id_seq"', 1, false);


--
-- Name: CsTicket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."CsTicket_id_seq"', 1, false);


--
-- Name: Message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Message_id_seq"', 1, false);


--
-- Name: Report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Report_id_seq"', 1, false);


--
-- Name: Request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Request_id_seq"', 8, true);


--
-- Name: Review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Review_id_seq"', 1, false);


--
-- Name: Transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Transaction_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."User_id_seq"', 4, true);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Block Block_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_pkey" PRIMARY KEY (id);


--
-- Name: ChatRoom ChatRoom_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatRoom"
    ADD CONSTRAINT "ChatRoom_pkey" PRIMARY KEY (id);


--
-- Name: Complaint Complaint_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_pkey" PRIMARY KEY (id);


--
-- Name: CsTicket CsTicket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CsTicket"
    ADD CONSTRAINT "CsTicket_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: Request Request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Block_blockerId_blockedUserId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Block_blockerId_blockedUserId_key" ON public."Block" USING btree ("blockerId", "blockedUserId");


--
-- Name: Review_requestId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Review_requestId_key" ON public."Review" USING btree ("requestId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _ChatRoomToUser_AB_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "_ChatRoomToUser_AB_unique" ON public."_ChatRoomToUser" USING btree ("A", "B");


--
-- Name: _ChatRoomToUser_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_ChatRoomToUser_B_index" ON public."_ChatRoomToUser" USING btree ("B");


--
-- Name: AuditLog AuditLog_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Block Block_blockedUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Block Block_blockerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatRoom ChatRoom_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatRoom"
    ADD CONSTRAINT "ChatRoom_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Complaint Complaint_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Complaint Complaint_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Complaint"
    ADD CONSTRAINT "Complaint_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CsTicket CsTicket_handlerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CsTicket"
    ADD CONSTRAINT "CsTicket_handlerId_fkey" FOREIGN KEY ("handlerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CsTicket CsTicket_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CsTicket"
    ADD CONSTRAINT "CsTicket_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CsTicket CsTicket_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CsTicket"
    ADD CONSTRAINT "CsTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_chatRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES public."ChatRoom"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Report Report_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Report Report_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Request Request_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Request"
    ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_targetUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."Report"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."Request"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _ChatRoomToUser _ChatRoomToUser_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ChatRoomToUser"
    ADD CONSTRAINT "_ChatRoomToUser_A_fkey" FOREIGN KEY ("A") REFERENCES public."ChatRoom"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ChatRoomToUser _ChatRoomToUser_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ChatRoomToUser"
    ADD CONSTRAINT "_ChatRoomToUser_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ExZpgIKRm6RwkfoZeVF5R4JfoBx7krAH7lbLHhoZoGghUjSy91ezXEw84kWwwxc

