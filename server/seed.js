require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Zone = require('./models/Zone');
const NoiseLog = require('./models/NoiseLog');
const Contact = require('./models/Contact');
const connectDB = require('./config/db');

const initialZones = [
    {
        name: 'Central Silent Study Library',
        category: 'Library',
        location: 'Level 2 - Main Academic Commons',
        threshold: 55,
        currentLevel: 42,
        status: 'normal',
        capacity: 140,
        rating: 4.9,
        description: 'Primary quiet study zone dedicated to focused individual research and reading. Monitored continuously via high-precision electret acoustic transducer.',
        image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80'
        ],
        hardwareNode: {
            nodeId: 'ARDUINO-NANO-LIB-01',
            mcu: 'Arduino Nano (ATmega328P)',
            sensorType: 'MAX4466 Electret Mic with AGC',
            samplingRate: '1200 Hz RMS Window',
            baudRate: 115200,
            status: 'online'
        },
        acousticSpecs: {
            targetSpl: '35-45 dBA',
            noiseRatingCriterion: 'NC-25',
            reverberationTime: '0.45s RT60',
            complianceStandard: 'ISO 1996-2 Quiet Room Criterion'
        }
    },
    {
        name: 'ICU Critical Recovery Ward',
        category: 'Hospital',
        location: 'West Medical Tower - 4th Floor',
        threshold: 50,
        currentLevel: 46,
        status: 'normal',
        capacity: 24,
        rating: 5.0,
        description: 'Post-operative and intensive medical monitoring pavilion where acoustic disturbance directly impacts physiological patient recovery.',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
        ],
        hardwareNode: {
            nodeId: 'ARDUINO-NANO-ICU-02',
            mcu: 'Arduino Nano 33 BLE Sense',
            sensorType: 'MP34DT05 MEMS Digital PDM Mic',
            samplingRate: '2000 Hz Peak Detection',
            baudRate: 115200,
            status: 'online'
        },
        acousticSpecs: {
            targetSpl: '30-40 dBA',
            noiseRatingCriterion: 'NC-20',
            reverberationTime: '0.35s RT60',
            complianceStandard: 'WHO Environmental Noise Healthcare Standard'
        }
    },
    {
        name: 'Nanotech Precision Robotics Lab',
        category: 'Lab',
        location: 'Science Complex - Sub-level B1',
        threshold: 65,
        currentLevel: 58,
        status: 'normal',
        capacity: 35,
        rating: 4.8,
        description: 'Vibration and high-frequency acoustic monitoring lab hosting atomic force microscopy and micro-electronic prototyping stations.',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
        ],
        hardwareNode: {
            nodeId: 'ARDUINO-NANO-LAB-03',
            mcu: 'Arduino Nano (ATmega328P)',
            sensorType: 'KY-037 High Sensitivity Sound Module',
            samplingRate: '1500 Hz Multi-band',
            baudRate: 115200,
            status: 'online'
        },
        acousticSpecs: {
            targetSpl: '45-60 dBA',
            noiseRatingCriterion: 'NC-35',
            reverberationTime: '0.50s RT60',
            complianceStandard: 'IEEE Precision Lab Standards'
        }
    },
    {
        name: 'Executive Boardroom & Telepresence',
        category: 'Conference',
        location: 'Headquarters Tower - 18th Floor',
        threshold: 60,
        currentLevel: 44,
        status: 'normal',
        capacity: 28,
        rating: 4.7,
        description: 'Acoustically treated conference room for hybrid executive meetings and international telepresence broadcasts requiring crystal-clear audio SNR.',
        image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80'
        ],
        hardwareNode: {
            nodeId: 'ARDUINO-NANO-CONF-04',
            mcu: 'Arduino Nano Every',
            sensorType: 'MAX9814 Low Noise Mic Preamp',
            samplingRate: '1000 Hz RMS',
            baudRate: 115200,
            status: 'online'
        },
        acousticSpecs: {
            targetSpl: '40-50 dBA',
            noiseRatingCriterion: 'NC-30',
            reverberationTime: '0.40s RT60',
            complianceStandard: 'ANSI/ASA S12.60 Acoustic Guidelines'
        }
    },
    {
        name: 'University Examination Hall Delta',
        category: 'Classroom',
        location: 'Academic Hall East - Wing 1',
        threshold: 52,
        currentLevel: 38,
        status: 'normal',
        capacity: 250,
        rating: 4.9,
        description: 'Large-scale standardized examination hall under strict silence enforcement with ambient decibel warning sirens hooked to Arduino edge triggers.',
        image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80'
        ],
        hardwareNode: {
            nodeId: 'ARDUINO-NANO-EXAM-05',
            mcu: 'Arduino Nano (ATmega328P)',
            sensorType: 'MAX4466 Electret Microphone',
            samplingRate: '1000 Hz RMS',
            baudRate: 115200,
            status: 'online'
        },
        acousticSpecs: {
            targetSpl: '35-45 dBA',
            noiseRatingCriterion: 'NC-25',
            reverberationTime: '0.60s RT60',
            complianceStandard: 'National Academic Examination Protocol'
        }
    },
    {
        name: 'Digital Audio Production Suite',
        category: 'Office',
        location: 'Media Center - Studio 3',
        threshold: 48,
        currentLevel: 41,
        status: 'normal',
        capacity: 12,
        rating: 5.0,
        description: 'Sound-isolated studio recording booth for e-learning, podcasting, and acoustic engineering calibration tests.',
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
        ],
        hardwareNode: {
            nodeId: 'ARDUINO-NANO-AUDIO-06',
            mcu: 'Arduino Nano 33 BLE Sense',
            sensorType: 'MEMS PDM Micro-array',
            samplingRate: '4000 Hz Fast Fourier Transform',
            baudRate: 115200,
            status: 'online'
        },
        acousticSpecs: {
            targetSpl: '25-35 dBA',
            noiseRatingCriterion: 'NC-15',
            reverberationTime: '0.25s RT60',
            complianceStandard: 'EBU R128 Loudness & Silence Criteria'
        }
    },
    {
        name: 'Pediatric Inpatient Quiet Wing',
        category: 'Hospital',
        location: 'Children Pavilion - Level 3',
        threshold: 50,
        currentLevel: 48,
        status: 'normal',
        capacity: 30,
        rating: 4.8,
        description: 'Specialized inpatient ward focused on pediatric recovery and nighttime sleep hygiene with acoustic threshold feedback.',
        image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80'
        ],
        hardwareNode: {
            nodeId: 'ARDUINO-NANO-PED-07',
            mcu: 'Arduino Nano (ATmega328P)',
            sensorType: 'MAX4466 Electret Microphone',
            samplingRate: '1000 Hz RMS',
            baudRate: 115200,
            status: 'online'
        },
        acousticSpecs: {
            targetSpl: '35-45 dBA',
            noiseRatingCriterion: 'NC-25',
            reverberationTime: '0.35s RT60',
            complianceStandard: 'AAP Pediatric Sleep Hygiene Guidelines'
        }
    },
    {
        name: 'Server Farm & Core Switch Vault',
        category: 'Lab',
        location: 'Data Center Basement 2',
        threshold: 75,
        currentLevel: 68,
        status: 'normal',
        capacity: 8,
        rating: 4.6,
        description: 'Critical IT infrastructure room where fan cooling acoustics are mapped to detect turbine bearing wear and abnormal vibration spikes.',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80'
        ],
        hardwareNode: {
            nodeId: 'ARDUINO-NANO-SRV-08',
            mcu: 'Arduino Nano (ATmega328P)',
            sensorType: 'KY-038 Sound Detection Sensor',
            samplingRate: '2000 Hz Harmonic Analysis',
            baudRate: 115200,
            status: 'online'
        },
        acousticSpecs: {
            targetSpl: '65-75 dBA',
            noiseRatingCriterion: 'NC-55',
            reverberationTime: '0.80s RT60',
            complianceStandard: 'ASHRAE TC 9.9 Acoustic Guidelines for Data Centers'
        }
    }
];

const seedDatabase = async () => {
    try {
        await connectDB();
        console.log('🌱 Starting database seeding for SilentAlert...');

        // 1. Seed Users (Demo Admin and Demo User)
        console.log('👤 Seeding Demo Users...');
        await User.deleteMany({});

        const adminUser = await User.create({
            name: 'Acoustic Chief Administrator',
            email: 'admin@silentalert.io',
            password: 'Admin@1234',
            role: 'admin',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            organization: 'Metropolitan Smart Campus Network',
            phone: '+1 (555) 789-0123',
            bio: 'Chief Acoustic Engineer overseeing campus-wide IoT telemetry nodes, edge decibel thresholds, and noise violation dispatches.'
        });

        const demoUser = await User.create({
            name: 'Lead Library Supervisor',
            email: 'user@silentalert.io',
            password: 'User@1234',
            role: 'user',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
            organization: 'Central Academic University',
            phone: '+1 (555) 456-7890',
            bio: 'Library facility manager monitoring reading room acoustic compliance and real-time noise alerts.'
        });

        console.log(`✅ Users created: \n   - Admin: admin@silentalert.io (Admin@1234)\n   - User: user@silentalert.io (User@1234)`);

        // 2. Seed Zones
        console.log('🏢 Seeding Monitored Zones...');
        await Zone.deleteMany({});
        const zonesWithCreator = initialZones.map(z => ({ ...z, createdBy: adminUser._id }));
        const createdZones = await Zone.insertMany(zonesWithCreator);
        console.log(`✅ ${createdZones.length} Monitored Zones seeded successfully.`);

        // 3. Seed Telemetry Noise Logs
        console.log('📊 Seeding Acoustic Noise Telemetry Logs...');
        await NoiseLog.deleteMany({});
        const logs = [];
        const now = Date.now();

        for (let i = 40; i >= 0; i--) {
            const time = new Date(now - i * 60 * 1000); // 1 minute intervals
            const libVal = Math.floor(38 + Math.random() * 12); // 38-50 dB
            const classVal = Math.floor(42 + Math.random() * 18); // 42-60 dB
            const labVal = Math.floor(48 + Math.random() * 15); // 48-63 dB
            const confVal = Math.floor(35 + Math.random() * 20); // 35-55 dB

            logs.push({
                Library: libVal,
                Classroom: classVal,
                Lab: labVal,
                ConferenceRoom: confVal,
                source: 'Arduino Nano Edge Node Gateway',
                peakDecibel: Math.max(libVal, classVal, labVal, confVal),
                averageDecibel: Math.round(((libVal + classVal + labVal + confVal) / 4) * 10) / 10,
                alertTriggered: Math.max(libVal, classVal, labVal, confVal) > 65,
                timestamp: time
            });
        }

        await NoiseLog.insertMany(logs);
        console.log(`✅ ${logs.length} Telemetry logs seeded.`);

        // 4. Seed Initial Contact
        console.log('✉️ Seeding Sample Contact Inquiry...');
        await Contact.deleteMany({});
        await Contact.create({
            name: 'Dr. Evelyn Vance',
            email: 'evelyn.vance@metrohospital.org',
            subject: 'Acoustic Monitoring Deployment for ICU Ward',
            message: 'We are looking to implement SilentAlert across 4 ICU recovery wings using Arduino Nano nodes to reduce ambient noise disruption for recovering cardiac patients.',
            status: 'unread'
        });
        console.log('✅ Sample Contact inquiry seeded.');

        console.log('🎉 Database Seeding Completed Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding Error:', err);
        process.exit(1);
    }
};

if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;

