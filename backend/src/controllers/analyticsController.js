import Experiment from '../models/Experiment.js';
import Equipment from '../models/Equipment.js';
import Dataset from '../models/Dataset.js';
import Reservation from '../models/Reservation.js';
import User from '../models/User.js';

export async function overview(req, res, next) {
  try {
    const [experiments, equipment, datasets, reservations, researchers] = await Promise.all([
      Experiment.find().select('status createdAt'),
      Equipment.find().select('name utilization status'),
      Dataset.find().select('createdAt size'),
      Reservation.find().select('startTime endTime status'),
      User.countDocuments({ role: 'researcher', active: true }),
    ]);

    const byStatus = {};
    experiments.forEach((e) => {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    });

    const hours = reservations
      .filter((r) => ['Approved', 'Completed'].includes(r.status))
      .reduce((sum, r) => sum + Math.max(0, (new Date(r.endTime) - new Date(r.startTime)) / 36e5), 0);

    const uploadsByMonth = {};
    datasets.forEach((d) => {
      const monthKey = new Date(d.createdAt).toISOString().slice(0, 7);
      uploadsByMonth[monthKey] = (uploadsByMonth[monthKey] || 0) + 1;
    });

    const avgUtil = equipment.length
      ? Number((equipment.reduce((sum, e) => sum + (e.utilization || 0), 0) / equipment.length).toFixed(1))
      : 0;

    res.json({
      counts: {
        experiments: experiments.length,
        equipment: equipment.length,
        datasets: datasets.length,
        researchers,
      },
      experimentStatus: byStatus,
      usageHours: Number(hours.toFixed(1)),
      averageUtilization: avgUtil,
      equipment: equipment.map((e) => ({
        name: e.name,
        utilization: e.utilization || 0,
        status: e.status,
      })),
      uploads: Object.entries(uploadsByMonth).map(([month, count]) => ({ month, count })),
      storageBytes: datasets.reduce((sum, d) => sum + (d.size || 0), 0),
    });
  } catch (error) {
    next(error);
  }
}
