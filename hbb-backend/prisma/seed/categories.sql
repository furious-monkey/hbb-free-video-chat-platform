-- Seed data for Category table 
INSERT INTO hbb_db."Category" (id, name, "imageUrl", "createdAt", "updatedAt") VALUES
('20000000-0000-0000-0000-000000000001', 'Yoga', 'cm2ieomcu0000c6mfesbfztl0', NOW(), NOW()),
('20000000-0000-0000-0000-000000000002', 'Writer', 'cm2ieq05s0001c6mf9n5awr6y', NOW(), NOW()),
('20000000-0000-0000-0000-000000000003', 'Vacation', 'cm2ieqwmi0002c6mfac95if08', NOW(), NOW()),
('20000000-0000-0000-0000-000000000004', 'Tv & movies', 'cm2iertdr0003c6mfvooxut3t', NOW(), NOW()),
('20000000-0000-0000-0000-000000000005', 'Travel', 'cm2iesp0w0004c6mfrqrky5mt', NOW(), NOW()),
('20000000-0000-0000-0000-000000000006', 'Tech', 'cm2ietg870005c6mfo1vo0ktg', NOW(), NOW()),
('20000000-0000-0000-0000-000000000007', 'Sports', 'cm2ieye6a0006c6mfwxguh8ac', NOW(), NOW()),
('20000000-0000-0000-0000-000000000008', 'Photographer', 'cm2iez5900007c6mf5an0qomm', NOW(), NOW()),
('20000000-0000-0000-0000-000000000009', 'Pet', 'cm2if01vw0008c6mfy6im5ctj', NOW(), NOW()),
('20000000-0000-0000-0000-000000000010', 'Music', 'cm2if1eqc0009c6mfshv4ihbl', NOW(), NOW()),
('20000000-0000-0000-0000-000000000011', 'Lifestyle', 'cm2if22c7000ac6mf1wd37y1w', NOW(), NOW()),
('20000000-0000-0000-0000-000000000012', 'Health and wellness', 'cm2if2naq000bc6mffnwif04h', NOW(), NOW()),
('20000000-0000-0000-0000-000000000013', 'Gamer', 'cm2if3eq8000cc6mfg3l6e98e', NOW(), NOW()),
('20000000-0000-0000-0000-000000000014', 'Food', 'cm2if40jq000dc6mflyhmspql', NOW(), NOW()),
('20000000-0000-0000-0000-000000000015', 'Fitness', 'cm2if4mvy000ec6mf9dchbl8j', NOW(), NOW()),
('20000000-0000-0000-0000-000000000016', 'Fashion', 'cm2if56ns000fc6mf9lxptrgj', NOW(), NOW()),
('20000000-0000-0000-0000-000000000017', 'Dancer', 'cm2if5qes000gc6mfau3hxkd4', NOW(), NOW()),
('20000000-0000-0000-0000-000000000018', 'Content creator', 'cm2if6bjg000hc6mfyzt3wr7e', NOW(), NOW()),
('20000000-0000-0000-0000-000000000019', 'Business', 'cm2if780z000ic6mf0yb1o9rc', NOW(), NOW()),
('20000000-0000-0000-0000-000000000020', 'Books', 'cm2if7w59000jc6mfxncx6syv', NOW(), NOW()),
('20000000-0000-0000-0000-000000000021', 'Beauty', 'cm2if8ezm000kc6mf3i1kelsh', NOW(), NOW()),
('20000000-0000-0000-0000-000000000022', 'Art', 'cm2if8y4b000lc6mfh9qxpck1', NOW(), NOW());


-- Seed data to add the category images
INSERT INTO images (id, url, ETag, Location, key, Bucket, UserId, createdAt)
VALUES
('cm2ieomcu0000c6mfesbfztl0', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/b7b8b339-8c22-4af0-8338-c6738bd0437d_1729478226168', 'ebfae006df263f8b6e18ebd35e6547e5', NULL, 'images/b7b8b339-8c22-4af0-8338-c6738bd0437d_1729478226168', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26', '2024-10-21 02:37:09.294'),
('cm2ieq05s0001c6mf9n5awr6y', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/f1112ec8-bafa-4bfe-8b72-d52ad1fc0ece_1729478290159', 'da4265d0f204e16ee68f4cf71b9fc719', NULL, 'images/f1112ec8-bafa-4bfe-8b72-d52ad1fc0ece_1729478290159', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26', '2024-10-21 02:38:13.84'),
('cm2ieqwmi0002c6mfac95if08', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/fd7686d8-9e9a-41ff-8846-dbdda887ae0e_1729478331573', 'cf77386ffe7cd062f4a101dc5c068b98', NULL, 'images/fd7686d8-9e9a-41ff-8846-dbdda887ae0e_1729478331573', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26', '2024-10-21 02:38:55.91'),
('cm2iertdr0003c6mfvooxut3t', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/ee25877a-d236-4834-b3e7-96194ec2ad82_1729478373589', 'afab4eb07da236e051933796608c0125', NULL, 'images/ee25877a-d236-4834-b3e7-96194ec2ad82_1729478373589', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26', '2024-10-21 02:39:38.367'),
('cm2iesp0w0004c6mfrqrky5mt', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/31ff261d-267b-4b50-b71c-1ab9ed664880_1729478414816', 'bbe3bbb2bd270e59c5257a9dcb7a0830', NULL, 'images/31ff261d-267b-4b50-b71c-1ab9ed664880_1729478414816', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26', '2024-10-21 02:40:19.376'),
('cm2ietg870005c6mfo1vo0ktg', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/15ce7227-345b-4279-890e-2e3f0a1ac477_1729478453569', '5326b3aadd5e5e4cc2a28f42245cbe6f', NULL, 'images/15ce7227-345b-4279-890e-2e3f0a1ac477_1729478453569', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26', '2024-10-21 02:40:54.631'),
('cm2ieye6a0006c6mfwxguh8ac', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/9ba13a86-78af-4458-8b60-26f5724957d4_1729478681852', '5c2919027ff818e5d688a3c5c6601ad3', NULL, 'images/9ba13a86-78af-4458-8b60-26f5724957d4_1729478681852', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26', '2024-10-21 02:44:45.242'),
('cm2iez5900007c6mf5an0qomm', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/1c700d11-c8a2-4784-b384-dfd0be899c13_1729478716087', 'cc63c4fcaea25eae8aab22bd8ba34181', NULL, 'images/1c700d11-c8a2-4784-b384-dfd0be899c13_1729478716087', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26', '2024-10-21 02:45:20.34'),
('cm2if01vw0008c6mfy6im5ctj', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/45877ff3-c0b6-478c-89ff-815ff8fcaa87_1729478760973', 'a3ce98821de0a8323c435c2b6960025d', NULL, 'images/45877ff3-c0b6-478c-89ff-815ff8fcaa87_1729478760973', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26', '2024-10-21 02:46:02.636'),
('cm2if1eqc0009c6mfshv4ihbl', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/b69a4360-0f4b-4fae-aa18-771b1bdcc2d3_1729478823292', 'f37e1da3d2631db74dc199a8a0ce897f', NULL, 'images/b69a4360-0f4b-4fae-aa18-771b1bdcc2d3_1729478823292', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26', '2024-10-21 02:47:05.94'),
('cm2if6btr000hc6mfqewm0xh4', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/1b32f9a5-d87c-46e5-9629-1070f0eafc63_1729479058059',	'f1b0f702dddeec675cd16e3ebcfc0a7e', NULL, 'images/1b32f9a5-d87c-46e5-9629-1070f0eafc63_1729479058059', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:51:11.068'),
('cm2if750w000ic6mfi2vi28nw', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/8f278ad8-33c4-4e9b-86b7-011349f9ae8f_1729479091939',	'bce5b8cf053ae27ba25a8260ed31710e', NULL, 'images/8f278ad8-33c4-4e9b-86b7-011349f9ae8f_1729479091939', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:51:31.24'),
('cm2if7k69000jc6mflgf4gjkf', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/bed8df73-51ff-49c7-a1f1-e8f8b3ce75a3_1729479120701',	'c53cf5942d4a108acb96a0473d934bfb', NULL, 'images/bed8df73-51ff-49c7-a1f1-e8f8b3ce75a3_1729479120701', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:52:00.781'),
('cm2if8qg1000kc6mfryjcn0id', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/c16e10ae-334b-4679-b97e-12a31e2f0ac3_1729479151898',	'6d14af2b5b30f99846dddb01a2dd02d9', NULL, 'images/c16e10ae-334b-4679-b97e-12a31e2f0ac3_1729479151898', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:52:31.129'),
('cm2if9bv7000lc6mfg1zcgqcz', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/19c9baec-9e39-4c23-b946-33ac312b3177_1729479192486',	'45280cf1d0323432b0bc8890c47decc3', NULL, 'images/19c9baec-9e39-4c23-b946-33ac312b3177_1729479192486', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:53:12.808'),
('cm2ifa4tf000mc6mfyrmwz0l7', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/431e2f13-2705-4bfb-8571-fd40d9ac0f08_1729479225365',	'a5cfc5b153de2fd39230da3e015c3429', NULL, 'images/431e2f13-2705-4bfb-8571-fd40d9ac0f08_1729479225365', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:53:45.352'),
('cm2ifapxi000nc6mfeeyrm6ga', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/64d3d226-2958-4cae-888e-1ae04bc8fc88_1729479264467',	'bcb8fb77f7f7792726e2b2205a5c014b', NULL, 'images/64d3d226-2958-4cae-888e-1ae04bc8fc88_1729479264467', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:54:25.669'),
('cm2ifb70y000oc6mfzcmfh7o2', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/8bc3301f-9a09-4fbe-9b64-32f528f797ff_1729479297397',	'11d2345e58922a9bb8373ec968b6e524', NULL, 'images/8bc3301f-9a09-4fbe-9b64-32f528f797ff_1729479297397', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:54:54.745'),
('cm2ifbthm000pc6mff1lmcu71', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/3a79b9a3-0b0b-4052-b346-cdba374f39a4_1729479332804',	'6b303f5e20549463bbacc36a97bb0260', NULL, 'images/3a79b9a3-0b0b-4052-b346-cdba374f39a4_1729479332804', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:55:33.392'),
('cm2ifcdjg000qc6mf3zw95igi', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/b0c79a7d-6e5b-406f-a703-f5ab4050d4ba_1729479372401',	'39fd6072aa5759be9e0c68baf19b4306', NULL, 'images/b0c79a7d-6e5b-406f-a703-f5ab4050d4ba_1729479372401', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:56:12.477'),
('cm2ifd38m000rc6mf1q3s2t0i', 'https://hunnybunnybun.s3.us-east-2.amazonaws.com/images/0596ac6d-e3e1-470b-a64a-1422f3e86d19_1729479404378',	'16969e54cd67d77424d17e14d7ad53e8', NULL, 'images/0596ac6d-e3e1-470b-a64a-1422f3e86d19_1729479404378', 'hunnybunnybun', '1f5a4f3d-814b-4982-964a-48df0c0ecf26',	'2024-10-21 02:56:43.991');

