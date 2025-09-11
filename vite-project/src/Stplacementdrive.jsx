import React, { useEffect, useState } from 'react';
import { useSelector } from "react-redux";
export default function Stplacementdrive() {
  const [data, setData] = useState([]);
  const [modalData, setModalData] = useState(null);
const backendUrl = useSelector((state) => state.backend.backendUrl);
  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const response = await axios.post(`${backendUrl}/api/drivedataa`);
        setData(Array.isArray(response.data)?response.data:[]);
      } catch (err) {
        console.log(err);
      }
    };
    fetchDrives();
  }, []);

  const upcoming = data.filter(d => new Date(d.driveDate) >= new Date());
  const happened = data.filter(d => new Date(d.driveDate) < new Date());

  const openModal = (drive) => {
    setModalData(drive);
  };

  const closeModal = () => {
    setModalData(null);
  };

  const DriveCard = ({ drive,m }) => (
    <div
      className="card m-2 p-3 shadow"
      style={{ width: "250px", cursor: "pointer" }}
      onClick={() => openModal(drive)}
    >
      <h5>{drive.companyName}</h5>
      <p><strong>Role:</strong> {drive.jobRole}</p>
      <p><strong>Date:</strong> {new Date(drive.driveDate).toDateString()}</p>
      {m===1?<p><strong>Status:</strong> {drive.status}</p>:<p><strong>Status:</strong> Happend</p>}
    </div>
  );

  return (
    <div className="container">
      <h4 className="text-center mt-4">Placement Drives</h4>

      <h5 className="mt-4">Upcoming Drives</h5>
      <div className="d-flex flex-wrap">
        {upcoming.length > 0 ? (
          upcoming.map(d => <DriveCard key={d._id} drive={d} m={1}/>)
        ) : (
          <p>No upcoming drives.</p>
        )}
      </div>

      <h5 className="mt-4">Happened Drives</h5>
      <div className="d-flex flex-wrap">
        {happened.length > 0 ? (
          happened.map(d => <DriveCard key={d._id} drive={d} m={0} />)
        ) : (
          <p>No past drives.</p>
        )}
      </div>

      {modalData && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content p-3">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalData.companyName} - {modalData.jobRole}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <p><strong>Salary:</strong> {modalData.salaryPackage}</p>
                <p><strong>Eligibility:</strong> {modalData.eligibilityCriteria}</p>
                <p><strong>Date:</strong> {new Date(modalData.driveDate).toDateString()}</p>
                <p><strong>Description:</strong> {modalData.description}</p>
              </div>
              <div className="modal-footer">
                {new Date(modalData.driveDate) >= new Date() ? (
                  <a
                    href={modalData.registrationLink}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apply Now
                  </a>
                ) : (
                  <button className="btn btn-secondary" disabled>
                    Drive Closed
                  </button>
                )}
                <button className="btn btn-outline-secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
