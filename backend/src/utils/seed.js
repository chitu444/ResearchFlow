import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';

import User from '../models/User.js';
import Department from '../models/Department.js';
import Laboratory from '../models/Laboratory.js';
import Equipment from '../models/Equipment.js';
import Experiment from '../models/Experiment.js';
import ExperimentVersion from '../models/ExperimentVersion.js';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Reservation from '../models/Reservation.js';
import Dataset from '../models/Dataset.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

await connectDB();

console.log('[SEED] Clearing previous data for comprehensive scientific institutional seed...');
await Promise.all([
  User.deleteMany({}),
  Department.deleteMany({}),
  Laboratory.deleteMany({}),
  Equipment.deleteMany({}),
  Experiment.deleteMany({}),
  ExperimentVersion.deleteMany({}),
  Comment.deleteMany({}),
  Task.deleteMany({}),
  Reservation.deleteMany({}),
  Dataset.deleteMany({}),
  Notification.deleteMany({}),
  AuditLog.deleteMany({}),
]);

// 1. Create Users
const passwordHash = await bcrypt.hash('ResearchFlow@123', 12);

const users = await User.create([
  {
    name: 'Dr. Priya Nair',
    email: 'admin@researchflow.com',
    password: passwordHash,
    role: 'institution_admin',
    active: true,
    lastLogin: new Date(),
  },
  {
    name: 'Dr. Arjun Rao',
    email: 'manager@researchflow.com',
    password: passwordHash,
    role: 'lab_manager',
    active: true,
    lastLogin: new Date(Date.now() - 3600000 * 2),
  },
  {
    name: 'Dr. Meera Smith',
    email: 'researcher@researchflow.com',
    password: passwordHash,
    role: 'researcher',
    active: true,
    lastLogin: new Date(Date.now() - 3600000 * 5),
  },
  {
    name: 'Dr. Chen Wei',
    email: 'chen.wei@researchflow.com',
    password: passwordHash,
    role: 'researcher',
    active: true,
    lastLogin: new Date(Date.now() - 3600000 * 24),
  },
  {
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.j@researchflow.com',
    password: passwordHash,
    role: 'researcher',
    active: true,
    lastLogin: new Date(Date.now() - 3600000 * 12),
  },
]);

const [admin, manager, researcher, chen, sarah] = users;

// 2. Create Departments
const departments = await Department.create([
  {
    name: 'Experimental Physics',
    code: 'PHY',
    description: 'High-energy physics, particle detectors, and cryogenic instrumentation.',
  },
  {
    name: 'Materials Science & Engineering',
    code: 'MAT',
    description: 'Advanced alloys, 2D nanomaterials, and high-temperature thermal characterization.',
  },
  {
    name: 'Quantum Information & Computing',
    code: 'QIC',
    description: 'Superconducting qubits, quantum optics, and sub-kelvin microwave resonators.',
  },
  {
    name: 'Bio-Molecular & Structural Imaging',
    code: 'BIO',
    description: 'Cryo-electron microscopy, macromolecular structures, and cellular tomography.',
  },
  {
    name: 'Precision Optics & Spectroscopy',
    code: 'OPT',
    description: 'Ultrafast laser spectroscopy, terahertz photonics, and interferometer metrology.',
  },
]);

const [physics, materials, quantum, bio, optics] = departments;

// 3. Create Laboratories
const laboratories = await Laboratory.create([
  {
    name: 'Detector Systems Laboratory',
    code: 'DSL-01',
    department: physics._id,
    location: 'Building A / 2nd Floor, Bay 3',
    description: 'Particle detection benches, scintillation counters, and high-voltage supply bays.',
  },
  {
    name: 'Cryogenics & Sub-Kelvin Lab',
    code: 'CSL-03',
    department: physics._id,
    location: 'Building A / Basement Cryo Suite B1',
    description: 'Liquid helium closed-loop dilution refrigerators operating down to 10 mK.',
  },
  {
    name: 'Materials Characterization Suite',
    code: 'MCL-02',
    department: materials._id,
    location: 'Building B / 1st Floor',
    description: 'Thermal gravimetric analysis, XRD diffractometers, and mechanical stress benches.',
  },
  {
    name: 'Quantum Photonics & Resonator Bay',
    code: 'QPS-05',
    department: quantum._id,
    location: 'Building C / 3rd Floor Cleanroom',
    description: 'Single-photon avalanche detectors and microwave reflectometry test suites.',
  },
  {
    name: 'Advanced Cryo-TEM Suite',
    code: 'ACE-04',
    department: bio._id,
    location: 'Building D / Low-Vibration Sub-level',
    description: 'Ultra-stable 300kV transmission electron microscopy for atomic structure determination.',
  },
  {
    name: 'Ultrafast Laser Spectroscopy Bay',
    code: 'LSB-06',
    department: optics._id,
    location: 'Building B / 2nd Floor, Dark Bay 4',
    description: 'Titanium:Sapphire femtosecond pulsed laser systems and pump-probe spectrometer.',
  },
]);

const [dsl, csl, mcl, qps, ace, lsb] = laboratories;

// Assign departments & labs to users
await User.findByIdAndUpdate(manager._id, { department: physics._id, laboratory: dsl._id });
await User.findByIdAndUpdate(researcher._id, { department: physics._id, laboratory: dsl._id });
await User.findByIdAndUpdate(chen._id, { department: quantum._id, laboratory: qps._id });
await User.findByIdAndUpdate(sarah._id, { department: bio._id, laboratory: ace._id });

// 4. Create Scientific Instruments (Equipment)
const now = new Date();
const daysFromNow = (d) => new Date(now.getTime() + d * 86400000);

const equipment = await Equipment.create([
  {
    name: 'PX-400 Particle Detector',
    detectorType: 'Scintillation Particle Detector',
    manufacturer: 'Research Instruments Corp',
    model: 'PX-400',
    serialNumber: 'PX400-091-SN',
    laboratory: dsl._id,
    location: 'Detector Bay 3',
    status: 'Active',
    purchaseDate: new Date('2024-03-10'),
    installationDate: new Date('2024-04-01'),
    calibrationDate: new Date('2026-08-15'),
    nextCalibration: daysFromNow(45),
    utilization: 76,
    maintenanceHistory: [
      {
        date: new Date('2026-08-15'),
        description: 'Annual recalibration. PMT voltage baseline adjusted; zero drift verified.',
        performedBy: manager._id,
      },
      {
        date: new Date('2026-04-12'),
        description: 'Replaced high-voltage BNC coupling cables and cleaned front-end optics.',
        performedBy: manager._id,
      },
    ],
  },
  {
    name: 'ThermalScan T-12 Analyzer',
    detectorType: 'Differential Thermal Detector',
    manufacturer: 'ThermoLab Systems',
    model: 'T-12',
    serialNumber: 'TS12-221-A',
    laboratory: mcl._id,
    location: 'Thermal Bench 2',
    status: 'Calibrated',
    purchaseDate: new Date('2023-11-20'),
    calibrationDate: new Date('2026-09-01'),
    nextCalibration: daysFromNow(90),
    utilization: 48,
    maintenanceHistory: [
      {
        date: new Date('2026-09-01'),
        description: 'Purged furnace chamber with argon gas. Recalibrated thermocouple sensors.',
        performedBy: manager._id,
      },
    ],
  },
  {
    name: 'CryoStat Zero-X Dilution Refrigerator',
    detectorType: 'Sub-Kelvin Cryostat',
    manufacturer: 'Oxford CryoDynamics',
    model: 'Zero-X 15mK',
    serialNumber: 'OX-ZX-8820',
    laboratory: csl._id,
    location: 'Cryo Pit 1',
    status: 'Active',
    purchaseDate: new Date('2024-01-15'),
    calibrationDate: new Date('2026-07-20'),
    nextCalibration: daysFromNow(60),
    utilization: 84,
    maintenanceHistory: [
      {
        date: new Date('2026-07-20'),
        description: 'Compressor oil change and helium-3/helium-4 mixture purity verification.',
        performedBy: manager._id,
      },
    ],
  },
  {
    name: 'Titan Krios 300kV Cryo-TEM',
    detectorType: 'Transmission Electron Detector',
    manufacturer: 'Thermo Fisher Scientific',
    model: 'Titan Krios G4',
    serialNumber: 'TK-G4-0043',
    laboratory: ace._id,
    location: 'Cleanroom Bay A',
    status: 'Active',
    purchaseDate: new Date('2024-06-01'),
    calibrationDate: new Date('2026-09-10'),
    nextCalibration: daysFromNow(120),
    utilization: 91,
    maintenanceHistory: [
      {
        date: new Date('2026-09-10'),
        description: 'AutoLoader grid transfer stage aligned. Falcon 4i direct electron detector calibrated.',
        performedBy: manager._id,
      },
    ],
  },
  {
    name: 'QD-800 Quantum Spectrometer',
    detectorType: 'Single-Photon Spectrometer',
    manufacturer: 'Horiba Scientific',
    model: 'QD-800 Pro',
    serialNumber: 'HOR-QD800-11',
    laboratory: qps._id,
    location: 'Optical Table 1',
    status: 'Calibrated',
    purchaseDate: new Date('2025-02-14'),
    calibrationDate: new Date('2026-08-30'),
    nextCalibration: daysFromNow(75),
    utilization: 55,
    maintenanceHistory: [],
  },
  {
    name: 'NeutronFlux NC-50 Monitor',
    detectorType: 'Helium-3 Proportional Counter',
    manufacturer: 'Canberra Radiation Metrology',
    model: 'NC-50',
    serialNumber: 'CAN-NC50-99',
    laboratory: dsl._id,
    location: 'Radiation Shield Vault',
    status: 'Maintenance',
    purchaseDate: new Date('2022-09-01'),
    calibrationDate: new Date('2025-10-01'),
    nextCalibration: daysFromNow(-10), // Calibration Expired!
    utilization: 15,
    maintenanceHistory: [
      {
        date: new Date('2026-10-15'),
        description: 'High background noise detected. Moderator tube decommissioned for inspection.',
        performedBy: manager._id,
      },
    ],
  },
  {
    name: 'FemtoSecond Ti:Sapphire Laser Oscillator',
    detectorType: 'Pulsed Laser Source & Spectrometer',
    manufacturer: 'Coherent Inc',
    model: 'Chameleon Vision II',
    serialNumber: 'COH-CHAM-771',
    laboratory: lsb._id,
    location: 'Laser Table 2',
    status: 'Active',
    purchaseDate: new Date('2023-08-10'),
    calibrationDate: new Date('2026-06-15'),
    nextCalibration: daysFromNow(8), // Calibration due soon!
    utilization: 62,
    maintenanceHistory: [],
  },
  {
    name: 'AFM Dimension Icon Surface Scanner',
    detectorType: 'Atomic Force Microscope',
    manufacturer: 'Bruker Nano Surfaces',
    model: 'Dimension Icon',
    serialNumber: 'BRK-ICON-312',
    laboratory: mcl._id,
    location: 'Clean Bench 4',
    status: 'Installed',
    purchaseDate: new Date('2026-01-20'),
    nextCalibration: daysFromNow(30),
    utilization: 25,
    maintenanceHistory: [],
  },
]);

const [px400, t12, cryoStat, titanTem, qd800, nc50, laser, afm] = equipment;

// 5. Create Realistic Scientific Experiments
const experiments = await Experiment.create([
  {
    title: 'Muon Flux Characterization in Controlled Beam Conditions',
    description: 'High-precision characterization of cosmic and accelerator muon flux response across varied high-voltage bias levels and temperature gradients.',
    researchObjective: 'Quantify secondary electron gain stability and calibrate PMT signal baseline against calibration drift.',
    researchers: [researcher._id, manager._id],
    requiredEquipment: [px400._id],
    laboratory: dsl._id,
    status: 'Approved',
    createdBy: researcher._id,
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-11-15'),
    version: 2,
  },
  {
    title: 'Thermal Cycling and Microstructure Hysteresis of Alloy A17',
    description: 'Investigating reversible martensitic phase transformation kinetics in nickel-titanium alloy A17 through automated cyclic thermal ramping between -50°C and 450°C.',
    researchObjective: 'Measure thermal fatigue thresholds, latent enthalpy hysteresis, and lattice distortion over 500 thermal cycles.',
    researchers: [researcher._id],
    requiredEquipment: [t12._id, afm._id],
    laboratory: mcl._id,
    status: 'Running',
    createdBy: researcher._id,
    startDate: new Date('2026-09-15'),
    endDate: new Date('2026-10-30'),
    version: 3,
  },
  {
    title: 'Superconducting Transmon Qubit Coherence at 15 mK',
    description: 'Characterization of energy relaxation time (T1) and dephasing time (T2*) of 5-qubit planar transmon circuits mounted in a dilution cryostat under magnetic shielding.',
    researchObjective: 'Identify two-level system (TLS) dielectric defect densities in silicon substrate interfaces and improve gate fidelity past 99.8%.',
    researchers: [chen._id, manager._id],
    requiredEquipment: [cryoStat._id, qd800._id],
    laboratory: qps._id,
    status: 'Approved',
    createdBy: chen._id,
    startDate: new Date('2026-10-10'),
    endDate: new Date('2026-12-20'),
    version: 1,
  },
  {
    title: 'Atomic-Resolution Cryo-EM Reconstruction of Ribosomal Complexes',
    description: 'Single-particle cryogenic electron microscopy structure determination of human 80S mitochondrial ribosome in complex with novel antimicrobial translational inhibitors.',
    researchObjective: 'Achieve sub-2.2 Angstrom density map to resolve ligand binding pockets and hydration water molecules.',
    researchers: [sarah._id],
    requiredEquipment: [titanTem._id],
    laboratory: ace._id,
    status: 'Running',
    createdBy: sarah._id,
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-11-01'),
    version: 2,
  },
  {
    title: 'Ultrafast Carrier Dynamics in Suspended Monolayer Graphene',
    description: 'Time-resolved optical pump-probe spectroscopy of hot electron-phonon relaxation times in chemical vapor deposited graphene flakes.',
    researchObjective: 'Map non-equilibrium carrier thermalization lifetimes across 780 nm - 1100 nm spectral windows with 80 fs time resolution.',
    researchers: [chen._id, researcher._id],
    requiredEquipment: [laser._id],
    laboratory: lsb._id,
    status: 'Under Review',
    createdBy: chen._id,
    startDate: new Date('2026-10-25'),
    endDate: new Date('2026-12-05'),
    version: 1,
  },
  {
    title: 'Radiation Hardness of Silicon Photomultipliers (SiPM)',
    description: 'Evaluating neutron radiation damage and dark count rate escalation on next-generation silicon photomultiplier arrays intended for spaceborne gamma detectors.',
    researchObjective: 'Benchmark dark count rate versus neutron fluence exposure up to 10^12 1-MeV equivalent neutrons/cm2.',
    researchers: [researcher._id],
    requiredEquipment: [px400._id],
    laboratory: dsl._id,
    status: 'Draft',
    createdBy: researcher._id,
    startDate: new Date('2026-11-01'),
    endDate: new Date('2026-12-15'),
    version: 1,
  },
]);

const [expMuon, expAlloy, expQubit, expCryo, expLaser, expSipm] = experiments;

// 6. Create Experiment Versions
await ExperimentVersion.create([
  {
    experiment: expMuon._id,
    version: 1,
    changedBy: researcher._id,
    changes: { created: true },
    snapshot: expMuon.toObject(),
    createdAt: new Date('2026-10-01T09:00:00Z'),
  },
  {
    experiment: expMuon._id,
    version: 2,
    changedBy: manager._id,
    changes: { status: 'Approved', note: 'Reviewed PMT safety protocols; approved instrument schedule.' },
    snapshot: expMuon.toObject(),
    createdAt: new Date('2026-10-02T14:30:00Z'),
  },
  {
    experiment: expAlloy._id,
    version: 1,
    changedBy: researcher._id,
    changes: { created: true },
    snapshot: expAlloy.toObject(),
    createdAt: new Date('2026-09-15T10:00:00Z'),
  },
  {
    experiment: expAlloy._id,
    version: 2,
    changedBy: researcher._id,
    changes: { status: 'Submitted', researchObjective: 'Expanded thermal cycle scope from 200 to 500 cycles.' },
    snapshot: expAlloy.toObject(),
    createdAt: new Date('2026-09-18T11:00:00Z'),
  },
  {
    experiment: expAlloy._id,
    version: 3,
    changedBy: manager._id,
    changes: { status: 'Running', note: 'Calibrated T-12 and initiated first heating ramp.' },
    snapshot: expAlloy.toObject(),
    createdAt: new Date('2026-09-20T08:00:00Z'),
  },
  {
    experiment: expQubit._id,
    version: 1,
    changedBy: chen._id,
    changes: { created: true },
    snapshot: expQubit.toObject(),
    createdAt: new Date('2026-10-10T11:00:00Z'),
  },
  {
    experiment: expCryo._id,
    version: 1,
    changedBy: sarah._id,
    changes: { created: true },
    snapshot: expCryo.toObject(),
    createdAt: new Date('2026-09-01T09:30:00Z'),
  },
  {
    experiment: expCryo._id,
    version: 2,
    changedBy: manager._id,
    changes: { status: 'Running', note: 'Cryo-grid screening passed; loaded into Titan autoloader.' },
    snapshot: expCryo.toObject(),
    createdAt: new Date('2026-09-05T16:00:00Z'),
  },
]);

// 7. Create Tasks & Milestones
await Task.create([
  {
    experiment: expMuon._id,
    title: 'Calibrate dark count rate baseline at 420V bias',
    description: 'Ensure PMT dark current remains under 0.8 nA at room temperature.',
    assignee: researcher._id,
    status: 'Done',
    createdBy: researcher._id,
    dueDate: new Date('2026-10-05'),
  },
  {
    experiment: expMuon._id,
    title: 'Record 50-hour continuous beam cosmic muon coincidence count',
    description: 'Double scintillator coincidence configuration in Bay 3.',
    assignee: researcher._id,
    status: 'In Progress',
    createdBy: researcher._id,
    dueDate: new Date('2026-10-25'),
  },
  {
    experiment: expMuon._id,
    title: 'Perform temperature drift compensation benchmark',
    description: 'Verify gain shift between 18°C and 28°C.',
    assignee: manager._id,
    status: 'Todo',
    createdBy: researcher._id,
    dueDate: new Date('2026-11-05'),
  },
  {
    experiment: expAlloy._id,
    title: 'Prepare 50 specimen coupon bars of Alloy A17',
    description: 'Wire EDM cutting and electropolishing to optical flatness.',
    assignee: researcher._id,
    status: 'Done',
    createdBy: researcher._id,
    dueDate: new Date('2026-09-22'),
  },
  {
    experiment: expAlloy._id,
    title: 'Complete 250 heating/cooling thermal cycles on T-12',
    description: 'Record latent enthalpy phase peak shifts every 50 cycles.',
    assignee: researcher._id,
    status: 'Done',
    createdBy: researcher._id,
    dueDate: new Date('2026-10-15'),
  },
  {
    experiment: expAlloy._id,
    title: 'AFM surface topography scan of grain boundaries',
    description: 'Quantify dislocation slip step density on AFM Dimension Icon.',
    assignee: researcher._id,
    status: 'In Progress',
    createdBy: researcher._id,
    dueDate: new Date('2026-10-28'),
  },
  {
    experiment: expQubit._id,
    title: 'Cryostat cool-down to base temperature (12 mK)',
    description: 'Monitor dilution unit flow rate and condensation pressure.',
    assignee: chen._id,
    status: 'Done',
    createdBy: chen._id,
    dueDate: new Date('2026-10-12'),
  },
  {
    experiment: expQubit._id,
    title: 'Measure T1 relaxation across all 5 qubits',
    description: 'Exponential decay curve fitting on pulse echo readout.',
    assignee: chen._id,
    status: 'In Progress',
    createdBy: chen._id,
    dueDate: new Date('2026-10-26'),
  },
  {
    experiment: expCryo._id,
    title: 'Cryo-vitrification of 80S ribosome samples on Quantifoil grids',
    description: 'Vitrobot Mark IV plunge freezing in liquid ethane.',
    assignee: sarah._id,
    status: 'Done',
    createdBy: sarah._id,
    dueDate: new Date('2026-09-03'),
  },
  {
    experiment: expCryo._id,
    title: 'Acquire 8,000 multi-frame high-resolution dose-fractionated movies',
    description: 'Total electron dose: 45 e-/A2 over 40 frames.',
    assignee: sarah._id,
    status: 'In Progress',
    createdBy: sarah._id,
    dueDate: new Date('2026-10-20'),
  },
]);

// 8. Create Comments & Collaboration Notes
await Comment.create([
  {
    experiment: expMuon._id,
    author: researcher._id,
    body: 'Initial high-voltage sweep shows excellent peak resolution. Signal-to-noise ratio is measured at 28.4 dB with 420V bias.',
    createdAt: new Date('2026-10-03T11:20:00Z'),
  },
  {
    experiment: expMuon._id,
    author: manager._id,
    body: 'Verified PMT nitrogen purge line. Ready for overnight continuous acquisition.',
    createdAt: new Date('2026-10-04T15:45:00Z'),
  },
  {
    experiment: expAlloy._id,
    author: researcher._id,
    body: 'Cycle 200 shows a slight 1.4°C depression in the austenite finish temperature. Evidence of dislocation pinning.',
    createdAt: new Date('2026-10-14T09:15:00Z'),
  },
  {
    experiment: expQubit._id,
    author: chen._id,
    body: 'Qubit 3 exhibits T1 = 78 microseconds, a 25% improvement over the previous batch after oxygen plasma ash treatment.',
    createdAt: new Date('2026-10-18T14:10:00Z'),
  },
]);

// 9. Generate Realistic Scientific CSV Telemetry Files on Disk
fs.mkdirSync(env.uploadDir, { recursive: true });

function generateCsv(filename, headers, rowCount, generator) {
  const filePath = path.join(env.uploadDir, filename);
  const rows = [headers.join(',')];
  for (let i = 0; i < rowCount; i++) {
    rows.push(generator(i).join(','));
  }
  fs.writeFileSync(filePath, rows.join('\n'), 'utf8');
  return {
    filePath,
    size: fs.statSync(filePath).size,
  };
}

// Dataset 1: Muon detector counts & flux
const f1 = generateCsv(
  'muon_detector_run_091.csv',
  ['sample_id', 'elapsed_sec', 'muon_counts', 'pmt_voltage', 'temperature_c', 'flux_rate'],
  80,
  (i) => [
    i + 1,
    i * 15,
    Math.round(450 + Math.sin(i / 6) * 120 + (Math.random() * 40 - 20)),
    (410 + Math.random() * 0.8).toFixed(2),
    (22.1 + (i / 80) * 1.8 + Math.random() * 0.2).toFixed(2),
    (28.5 + Math.sin(i / 6) * 7.5 + (Math.random() * 2 - 1)).toFixed(2),
  ]
);

// Dataset 2: Thermal cycling temperature & latent heat
const f2 = generateCsv(
  'thermal_cycle_a17_run200.csv',
  ['cycle_num', 'temp_c', 'heat_flow_mw', 'strain_pct', 'acoustic_emission_db'],
  90,
  (i) => {
    const t = -20 + (i / 90) * 440;
    const latentPeak = Math.exp(-Math.pow((t - 180) / 35, 2)) * 65;
    return [
      200,
      t.toFixed(1),
      (12.5 + t * 0.08 + latentPeak + (Math.random() * 3 - 1.5)).toFixed(2),
      (0.1 + (t / 400) * 3.8 + Math.random() * 0.05).toFixed(3),
      (14 + (latentPeak > 15 ? 45 + Math.random() * 15 : Math.random() * 8)).toFixed(1),
    ];
  }
);

// Dataset 3: Qubit Ramsey fringe oscillation
const f3 = generateCsv(
  'qubit3_ramsey_coherence.csv',
  ['delay_ns', 'state_population', 'detuning_mhz', 'microwave_phase_rad'],
  75,
  (i) => {
    const delay = i * 20;
    const decay = Math.exp(-delay / 950);
    const pop = (0.5 + 0.48 * decay * Math.cos((delay * 2 * Math.PI) / 180) + (Math.random() * 0.04 - 0.02)).toFixed(3);
    return [delay, pop, 5.5, ((delay * 0.05) % (2 * Math.PI)).toFixed(3)];
  }
);

// Dataset 4: Laser pump-probe transient reflectance
const f4 = generateCsv(
  'laser_transient_reflectance.csv',
  ['time_ps', 'delta_reflectance_ppm', 'pump_fluence_uj', 'polarization_deg'],
  85,
  (i) => {
    const t = -2 + (i / 85) * 14;
    let signal = 0;
    if (t > 0) {
      signal = 820 * (0.85 * Math.exp(-t / 0.45) + 0.15 * Math.exp(-t / 3.2));
    }
    return [
      t.toFixed(2),
      (signal + (Math.random() * 25 - 12.5)).toFixed(1),
      45.0,
      0,
    ];
  }
);

// 10. Record Datasets in DB
await Dataset.create([
  {
    originalName: 'muon_detector_run_091.csv',
    storedName: 'muon_detector_run_091.csv',
    path: f1.filePath,
    mimeType: 'text/csv',
    size: f1.size,
    extension: '.csv',
    experiment: expMuon._id,
    equipment: px400._id,
    uploadedBy: researcher._id,
    metadata: {
      detectorModel: 'PX-400',
      temperature: 22.4,
      voltage: 410,
      sampleType: 'Atmospheric Muon Beam',
      location: 'Detector Bay 3',
      runNumber: '091',
      acquisitionDate: new Date('2026-10-18T10:00:00Z'),
      notes: 'High-voltage gain baseline verification with 420V bias.',
    },
  },
  {
    originalName: 'thermal_cycle_a17_run200.csv',
    storedName: 'thermal_cycle_a17_run200.csv',
    path: f2.filePath,
    mimeType: 'text/csv',
    size: f2.size,
    extension: '.csv',
    experiment: expAlloy._id,
    equipment: t12._id,
    uploadedBy: researcher._id,
    metadata: {
      detectorModel: 'T-12',
      temperature: 420.0,
      sampleType: 'Nickel-Titanium Alloy A17',
      location: 'Thermal Bench 2',
      runNumber: '200',
      acquisitionDate: new Date('2026-10-14T14:30:00Z'),
      notes: 'Thermal ramping cycle #200 between -20C and 420C under argon atmosphere.',
    },
  },
  {
    originalName: 'qubit3_ramsey_coherence.csv',
    storedName: 'qubit3_ramsey_coherence.csv',
    path: f3.filePath,
    mimeType: 'text/csv',
    size: f3.size,
    extension: '.csv',
    experiment: expQubit._id,
    equipment: cryoStat._id,
    uploadedBy: chen._id,
    metadata: {
      detectorModel: 'Zero-X 15mK',
      temperature: 0.015,
      sampleType: '5-Qubit Planar Transmon Chip #04',
      location: 'Cryo Pit 1',
      runNumber: 'Q3-RAMSEY-11',
      acquisitionDate: new Date('2026-10-19T09:00:00Z'),
      notes: 'Ramsey fringe coherence measurement with 5.5 MHz artificial detuning.',
    },
  },
  {
    originalName: 'laser_transient_reflectance.csv',
    storedName: 'laser_transient_reflectance.csv',
    path: f4.filePath,
    mimeType: 'text/csv',
    size: f4.size,
    extension: '.csv',
    experiment: expLaser._id,
    equipment: laser._id,
    uploadedBy: chen._id,
    metadata: {
      detectorModel: 'Chameleon Vision II',
      temperature: 21.0,
      sampleType: 'Monolayer Graphene on SiO2',
      location: 'Laser Table 2',
      runNumber: 'PUMP-PROBE-04',
      acquisitionDate: new Date('2026-10-21T16:00:00Z'),
      notes: 'Femtosecond pump-probe transient reflectance at 800nm pump / 850nm probe.',
    },
  },
]);

// 11. Create Realistic Equipment Reservations
const todayAt = (hours, mins = 0) => {
  const d = new Date(now);
  d.setHours(hours, mins, 0, 0);
  return d;
};

const dayAt = (offsetDays, hours, mins = 0) => {
  const d = daysFromNow(offsetDays);
  d.setHours(hours, mins, 0, 0);
  return d;
};

await Reservation.create([
  {
    equipment: px400._id,
    experiment: expMuon._id,
    requestedBy: researcher._id,
    startTime: todayAt(9, 0),
    endTime: todayAt(13, 0),
    status: 'Approved',
    notes: 'Morning beam calibration and PMT noise check.',
    reviewedBy: manager._id,
    reviewedAt: new Date(Date.now() - 86400000),
  },
  {
    equipment: px400._id,
    experiment: expMuon._id,
    requestedBy: researcher._id,
    startTime: todayAt(14, 0),
    endTime: todayAt(18, 0),
    status: 'Approved',
    notes: 'Afternoon continuous cosmic ray coincidence data capture.',
    reviewedBy: manager._id,
    reviewedAt: new Date(Date.now() - 86400000),
  },
  {
    equipment: t12._id,
    experiment: expAlloy._id,
    requestedBy: researcher._id,
    startTime: todayAt(10, 0),
    endTime: todayAt(16, 30),
    status: 'Approved',
    notes: 'Automated 50-cycle thermal heating program.',
    reviewedBy: manager._id,
    reviewedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    equipment: cryoStat._id,
    experiment: expQubit._id,
    requestedBy: chen._id,
    startTime: todayAt(8, 0),
    endTime: todayAt(20, 0),
    status: 'Approved',
    notes: 'Cryostat continuous sub-15mK microwave pulse calibration.',
    reviewedBy: manager._id,
    reviewedAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    equipment: titanTem._id,
    experiment: expCryo._id,
    requestedBy: sarah._id,
    startTime: dayAt(1, 9, 0),
    endTime: dayAt(1, 17, 0),
    status: 'Approved',
    notes: 'High-throughput 8,000 movie single-particle data collection.',
    reviewedBy: manager._id,
    reviewedAt: new Date(Date.now() - 86400000),
  },
  {
    equipment: qd800._id,
    experiment: expQubit._id,
    requestedBy: chen._id,
    startTime: dayAt(1, 11, 0),
    endTime: dayAt(1, 15, 0),
    status: 'Pending',
    notes: 'Single-photon emission spectrum verification.',
  },
  {
    equipment: laser._id,
    experiment: expLaser._id,
    requestedBy: chen._id,
    startTime: dayAt(2, 13, 0),
    endTime: dayAt(2, 17, 0),
    status: 'Pending',
    notes: 'Pump-probe optical delay line alignment.',
  },
  {
    equipment: afm._id,
    experiment: expAlloy._id,
    requestedBy: researcher._id,
    startTime: dayAt(3, 10, 0),
    endTime: dayAt(3, 14, 0),
    status: 'Pending',
    notes: 'Coupon surface topography and scratch hardness characterization.',
  },
  {
    equipment: px400._id,
    experiment: expSipm._id,
    requestedBy: researcher._id,
    startTime: dayAt(4, 9, 0),
    endTime: dayAt(4, 12, 0),
    status: 'Pending',
    notes: 'Silicon photomultiplier dark current comparison test.',
  },
]);

// 12. Create Notifications & Initial Audit Trail
await Notification.create([
  {
    recipient: researcher._id,
    title: 'Experiment Approved',
    message: 'Your research experiment "Muon Flux Characterization" was approved by Dr. Arjun Rao.',
    type: 'experiment',
    resourceType: 'Experiment',
    resourceId: expMuon._id.toString(),
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 4),
  },
  {
    recipient: researcher._id,
    title: 'Reservation Confirmed',
    message: 'PX-400 Particle Detector reservation for today (09:00 - 13:00) is confirmed.',
    type: 'reservation',
    resourceType: 'Reservation',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 18),
  },
  {
    recipient: manager._id,
    title: 'New Reservation Request',
    message: 'Dr. Chen Wei requested time on QD-800 Quantum Spectrometer.',
    type: 'reservation',
    resourceType: 'Reservation',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 1),
  },
  {
    recipient: manager._id,
    title: 'Equipment Calibration Alert',
    message: 'NeutronFlux NC-50 calibration is expired. Service or recalibration required.',
    type: 'system',
    resourceType: 'Equipment',
    resourceId: nc50._id.toString(),
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 8),
  },
]);

await AuditLog.create([
  {
    actor: admin._id,
    action: 'institution.seeded',
    resourceType: 'Institution',
    details: { departmentsCount: 5, labsCount: 6, equipmentCount: 8, experimentsCount: 6 },
    ip: '127.0.0.1',
    createdAt: new Date(Date.now() - 86400000 * 7),
  },
  {
    actor: manager._id,
    action: 'equipment.calibrated',
    resourceType: 'Equipment',
    resourceId: px400._id.toString(),
    details: { equipment: 'PX-400', nextCalibration: daysFromNow(45) },
    ip: '127.0.0.1',
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    actor: researcher._id,
    action: 'dataset.uploaded',
    resourceType: 'Dataset',
    details: { file: 'muon_detector_run_091.csv', size: f1.size },
    ip: '127.0.0.1',
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    actor: manager._id,
    action: 'reservation.reviewed',
    resourceType: 'Reservation',
    details: { status: 'Approved', equipment: 'PX-400 Particle Detector' },
    ip: '127.0.0.1',
    createdAt: new Date(Date.now() - 86400000),
  },
]);

console.log('========================================================================');
console.log('Scientific Institutional Seed Complete!');
console.log('Departments: 5 | Labs: 6 | Equipment: 8 | Experiments: 6 | Datasets: 4');
console.log('Credentials (Password for all: ResearchFlow@123):');
console.log(' - admin@researchflow.com      (Institution Admin)');
console.log(' - manager@researchflow.com    (Lab Manager)');
console.log(' - researcher@researchflow.com (Researcher - Physics/Materials)');
console.log(' - chen.wei@researchflow.com   (Researcher - Quantum)');
console.log(' - sarah.j@researchflow.com    (Researcher - Structural Bio)');
console.log('========================================================================');

await mongoose.disconnect();
process.exit(0);
