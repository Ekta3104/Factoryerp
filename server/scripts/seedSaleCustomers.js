import { pool } from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const customers = [
  {
    name: 'Golite Con- Tech LLP',
    address: 'HOUSE NO. GURUMITRA HOUSING SOCIETY, NALKESH ROAD BEHIND PETROL PUMP, TAL. SATANA, NAMPUR, Nashik',
    phone: null,
  },
  {
    name: 'SRIKAR BUILDING MATERIALS(MH) PRIVATE LIMITED',
    address: 'FLOOR 0, GAT NO. 272, SRIKAR BUILDING MATERIAL PVT LTD, AT-POST. KHOR, ZILHA PARISHAD PRIMARY SCHOOL MANEPISEVASTI, KHOR, Pune',
    phone: '8411841106',
  },
  {
    name: 'Siporex India Pvt Ltd',
    address: '72-76 Industrial Estate, Mundhawa, Pune',
    phone: null,
  },
  {
    name: 'Jagadguru Bricks Pvt Ltd',
    address: 'Office Add. SR No 288/1, 2/1/2 Uttareshwer Road, Jagatguru City, Lohagaon Pune, Gat No 238 Near MIDC, Markal Pune',
    phone: '8600789999',
  },
  {
    name: 'Firelight Infra Pvt Ltd',
    address: 'Gat no 44/50, Navlakh Umbre, Jadhavwadi village, Talegaon MIDC, Pune-410507',
    phone: null,
  },
  {
    name: 'Gazebo Blocks',
    address: 'Survey No-120, Mankivali, Near Dolavali, Railway Station, Khopoli, Raigad, Maharashtra',
    phone: '9324242417',
  },
  {
    name: 'PROSKY INFRATECH',
    address: 'SHOP NO. 910 ROONGTA FUTREX RD CIRCLE, GOVIND NAGAR, NASHIK',
    phone: null,
  },
  {
    name: 'PUSHPAM ENTERPRISES',
    address: 'THANE',
    phone: '8369170702',
  },
  {
    name: 'Mithril Aerocon Private Limited',
    address: '09/10, 1st FLOOR, DATTATRAY APT., THORAT COLONY, LANE NO 14, PUNE 411 004',
    phone: null,
  },
  {
    name: 'CONSTRO SOLUTIONS PVT LTD',
    address: 'FACTORY - FIVE STAR MIDC AREA, GAT NO -580 SINNAR PUNE HIGHWAY, KHAMBALE PHATA, TAL SINNAR, DIST -NASHIK',
    phone: null,
  },
  {
    name: 'SHREERANG GREEN CONCEPT AAC BLOCKS PVT.LTD',
    address: 'SURVEY NO. 316 & 317, AT POST. MHASA, TAL. MURBAD, DIST. THANE',
    phone: '9146887770',
  },
  {
    name: 'Vithoba Enterprises',
    address: 'Plot No-7, Phase-III, Musalgaon-Sinnar',
    phone: null,
  },
  {
    name: 'AEROGREEN BUILDING SOLUTIONS INDUSTRIES',
    address: '1ST FLOOR, RAJ AVENUE BUILDING, SECTOR-20, BEHIND-BHOOMI MALL, CBD - BELAPUR, Mumbai City, Maharashtra, 400614',
    phone: '9700802595',
  },
  {
    name: 'SHANTAI TRADERS',
    address: 'Nashik',
    phone: null,
  },
  {
    name: 'R V Enterrpises',
    address: 'Plot No. 2, Flat No. 15, Survey No. 20/3D/5, Shyam Nest Apartment, Onkar Nagar, Nashik, Nashik, Maharashtra, 422222',
    phone: '8308367060',
  },
];

async function seedSaleCustomers() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Seeding sale customers...');

    let inserted = 0;
    let skipped = 0;

    for (const c of customers) {
      const existing = await client.query('SELECT id FROM customers WHERE name = $1', [c.name]);
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }
      await client.query(
        `INSERT INTO customers (name, address, phone) VALUES ($1, $2, $3)`,
        [c.name, c.address, c.phone]
      );
      inserted++;
    }

    await client.query('COMMIT');
    console.log(`Done. Inserted: ${inserted}, Skipped (already existed): ${skipped}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding sale customers:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedSaleCustomers();
