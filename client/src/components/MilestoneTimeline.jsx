import React from 'react';

const MilestoneTimeline = ({ milestones }) => {
  if (!milestones || milestones.length === 0) return <div className="text-gray-500">No milestones yet.</div>;

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500';
      case 'approved': return 'bg-indigo-500';
      case 'in-progress': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {milestones.map((m, idx) => (
          <li key={m._id || idx}>
            <div className="relative pb-8">
              {idx !== milestones.length - 1 && (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusColor(m.status)}`}></span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{m.title}</span> - ${m.amount}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{m.description}</p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                    <time dateTime={m.dueDate}>{new Date(m.dueDate).toLocaleDateString()}</time>
                    <p className="mt-1 font-medium capitalize">{m.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default MilestoneTimeline;