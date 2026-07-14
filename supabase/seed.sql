-- ============================================================================
-- Agrawal Plywoods — seed data (Phase 1)
-- 15 listings: 12 approved (pagination >10 triggers) + 2 pending + 1 rejected.
-- Plus 3 contact requests (2 pending for the admin page, 1 to approve & test unlock).
-- All names/phones/emails are fake. photo_url uses placeholder images.
-- Run AFTER schema.sql. Safe to re-run: it clears both tables first.
-- ============================================================================

delete from public.contact_requests;
delete from public.listings;

-- ============ LISTINGS ============

insert into public.listings
  (name, price_per_unit, unit, quantity_available, notes, photo_url, seller_name, seller_phone, seller_email, status)
values
  -- 12 approved
  ('18mm Marine Ply 8x4',        2450.00, 'sheet',  120, 'BWP grade, waterproof, IS:710 certified.',        'https://picsum.photos/seed/ply01/600/400', 'Ramesh Traders',      '9812345671', 'ramesh.traders@gmail.com',  'approved'),
  ('12mm Commercial Ply 8x4',    1580.00, 'sheet',  200, 'MR grade, interior use.',                          'https://picsum.photos/seed/ply02/600/400', 'Sharma Timbers',      '9812345672', 'sharma.timber@yahoo.com',   'approved'),
  ('19mm Gurjan Ply 8x4',        3120.00, 'sheet',   80, 'Full gurjan core, red flag warranty.',             'https://picsum.photos/seed/ply03/600/400', 'Gupta Plywood Mart',  '9812345673', 'gupta.pw@gmail.com',        'approved'),
  ('6mm MDF Board 8x4',           640.00, 'sheet',  350, 'Smooth finish, ideal for laminates.',              'https://picsum.photos/seed/ply04/600/400', 'National Boards',     '9812345674', 'national.boards@gmail.com', 'approved'),
  ('1mm Sunmica Laminate',        980.00, 'sheet',  500, 'Glossy, assorted shades available.',               'https://picsum.photos/seed/ply05/600/400', 'Deco Surfaces',       '9812345675', null,                        'approved'),
  ('25mm Block Board 8x4',       2890.00, 'sheet',   60, 'Hardwood battens, warp resistant.',                'https://picsum.photos/seed/ply06/600/400', 'Ramesh Traders',      '9812345671', 'ramesh.traders@gmail.com',  'approved'),
  ('Teak Veneer 8x4',            1750.00, 'sheet',   90, 'Natural teak, book-matched.',                      'https://picsum.photos/seed/ply07/600/400', 'Veneer World',        '9812345677', 'veneerworld@outlook.com',   'approved'),
  ('4mm Plywood 8x4',             720.00, 'sheet',  300, 'Flexible, for curved surfaces.',                   'https://picsum.photos/seed/ply08/600/400', 'Sharma Timbers',      '9812345672', 'sharma.timber@yahoo.com',   'approved'),
  ('Waterproof WPC Board 8x4',   3450.00, 'sheet',   45, 'Termite proof, 100% waterproof.',                  'https://picsum.photos/seed/ply09/600/400', 'Modern Ply House',    '9812345679', 'modernply@gmail.com',       'approved'),
  ('Pine Wood Plank',             320.00, 'piece',  800, 'Seasoned pine, 6ft length.',                       'https://picsum.photos/seed/ply10/600/400', 'Forest Timber Co',    '9812345680', null,                        'approved'),
  ('Flush Door 7x3',            2150.00,   'piece',  70, 'Solid core, both side ply.',                       'https://picsum.photos/seed/ply11/600/400', 'Gupta Plywood Mart',  '9812345673', 'gupta.pw@gmail.com',        'approved'),
  ('PVC Foam Board 8x4',        1980.00,   'sheet', 110, 'Lightweight, moisture proof.',                     'https://picsum.photos/seed/ply12/600/400', 'Modern Ply House',    '9812345679', 'modernply@gmail.com',       'approved'),
  -- 2 pending (waiting for owner approval)
  ('9mm Commercial Ply 8x4',    1120.00,   'sheet', 150, 'MR grade, fresh stock.',                           'https://picsum.photos/seed/ply13/600/400', 'New Age Plywood',     '9812345683', 'newage.ply@gmail.com',      'pending'),
  ('Charcoal Louver Panel',     1450.00,   'sheet',  40, 'WPC louvers, interior wall cladding.',             'https://picsum.photos/seed/ply14/600/400', 'Deco Surfaces',       '9812345675', null,                        'pending'),
  -- 1 rejected
  ('Assorted Scrap Ply Lot',     150.00,   'piece', 500, 'Mixed offcuts, condition varies.',                 'https://picsum.photos/seed/ply15/600/400', 'Bargain Timbers',     '9812345685', 'bargain@gmail.com',         'rejected');

-- ============ CONTACT REQUESTS ============
-- Reference approved listings by name so no hard-coded listing UUIDs are needed.

insert into public.contact_requests (listing_id, buyer_name, buyer_phone, status)
select id, 'Anil Kumar',   '9900112233', 'pending'
  from public.listings where name = '18mm Marine Ply 8x4' limit 1;

insert into public.contact_requests (listing_id, buyer_name, buyer_phone, status)
select id, 'Priya Menon',  '9900112244', 'pending'
  from public.listings where name = '19mm Gurjan Ply 8x4' limit 1;

-- One already-approved request so check_contact_request returns real contact immediately.
insert into public.contact_requests (listing_id, buyer_name, buyer_phone, status)
select id, 'Suresh Rao',   '9900112255', 'approved'
  from public.listings where name = '12mm Commercial Ply 8x4' limit 1;
