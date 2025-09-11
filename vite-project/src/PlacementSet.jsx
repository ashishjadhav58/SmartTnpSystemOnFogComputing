import React, { useEffect, useState } from 'react';
import { useSelector } from "react-redux";
export default function PlacementSet() {
  const [data, setData] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [editableData, setEditableData] = useState(null);
  const [newDrive, setNewDrive] = useState({
    companyName: '',
    jobRole: '',
    salaryPackage: '',
    driveDate: '',
    eligibilityCriteria: '',
    description: '',
    registrationLink: '',
    status: 'Upcoming',
  });
  const backendUrl = useSelector((state) => state.backend.backendUrl);
  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const response = await axios.post(`${backendUrl}/api/drivedataa`);
        setData(response.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchDrives();
  }, []);

  const handleNewDriveChange = (e) => {
    const { name, value } = e.target;
    setNewDrive(prev => ({ ...prev, [name]: value }));
  };

  const addDrive = async () => {
    try {
      const res = await axios.post(`${backendUrl}/api/drivedata`, newDrive);
      setData(prev => [...prev, res.data]);
      setNewDrive({
        companyName: '',
        jobRole: '',
        salaryPackage: '',
        driveDate: '',
        eligibilityCriteria: '',
        description: '',
        registrationLink: '',
        status: 'Upcoming',
      });
    } catch (err) {
      console.log("Error adding drive:", err);
    }
  };

  const upcoming = data.filter(d => new Date(d.driveDate) >= new Date());
  const happened = data.filter(d => new Date(d.driveDate) < new Date());

  const openModal = (drive) => {
    setModalData(drive);
    setEditableData({ ...drive });
  };

  const closeModal = () => {
    setModalData(null);
    setEditableData(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${backendUrl}/api/drivedata/${editableData._id}`, editableData);
      const updatedList = data.map(d =>
        d._id === editableData._id ? editableData : d
      );
      setData(updatedList);
      closeModal();
    } catch (err) {
      console.log("Error updating drive:", err);
    }
  };

  const DriveCard = ({ drive }) => (
    <div
      className="card m-2 p-3 shadow"
      style={{ width: "250px", cursor: "pointer" }}
      onClick={() => openModal(drive)}
    >
      <h5>{drive.companyName}</h5>
      <p><strong>Role:</strong> {drive.jobRole}</p>
      <p><strong>Date:</strong> {new Date(drive.driveDate).toDateString()}</p>
      <p><strong>Status:</strong> {drive.status}</p>
    </div>
  );

  return (
    <div className="container text-center">
      <h4 className="text-center mt-4 ms-5">Placement Drives</h4>

      {/* Add New Drive Block */}
      <div className="card p-3 mb-4 ms-5 mt-3">
        <h5>Add New Drive</h5>
        <div className="row " >
          <div className="col-md-4 mb-2">
            <input type="text" className="form-control" name="companyName" placeholder="Company Name" value={newDrive.companyName} onChange={handleNewDriveChange} />
          </div>
          <div className="col-md-4 mb-2">
            <input type="text" className="form-control" name="jobRole" placeholder="Job Role" value={newDrive.jobRole} onChange={handleNewDriveChange} />
          </div>
          <div className="col-md-4 mb-2">
            <input type="text" className="form-control" name="salaryPackage" placeholder="Salary Package" value={newDrive.salaryPackage} onChange={handleNewDriveChange} />
          </div>
          <div className="col-md-4 mb-2">
            <input type="date" className="form-control" name="driveDate" value={newDrive.driveDate} onChange={handleNewDriveChange} />
          </div>
          <div className="col-md-4 mb-2">
            <input type="text" className="form-control" name="eligibilityCriteria" placeholder="Eligibility" value={newDrive.eligibilityCriteria} onChange={handleNewDriveChange} />
          </div>
          <div className="col-md-4 mb-2">
            <input type="text" className="form-control" name="registrationLink" placeholder="Registration Link" value={newDrive.registrationLink} onChange={handleNewDriveChange} />
          </div>
          <div className="col-12 mb-2">
            <textarea className="form-control" name="description" placeholder="Description" value={newDrive.description} onChange={handleNewDriveChange}></textarea>
          </div>
          <div className="col-12">
            <button className="btn btn-primary" onClick={addDrive}>Add Drive</button>
          </div>
        </div>
      </div>

      {/* Upcoming Drives */}
      <h5 className="mt-4 text-start ms-3">Upcoming Drives</h5>
      <div className="d-flex flex-wrap">
        {upcoming.length > 0 ? upcoming.map(d => <DriveCard key={d._id} drive={d} />) : <p>No upcoming drives.</p>}
      </div>

      {/* Happened Drives */}
      <h5 className="mt-4 text-start ms-3">Happened Drives</h5>
      <div className="d-flex flex-wrap">
        {happened.length > 0 ? happened.map(d => <DriveCard key={d._id} drive={d} />) : <p>No past drives.</p>}
      </div>

      {/* Edit Modal */}
      {modalData && editableData && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content p-3">
              <div className="modal-header">
                <h5 className="modal-title">Update Drive - {editableData.companyName}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                {["jobRole", "salaryPackage", "driveDate", "eligibilityCriteria", "registrationLink"].map((field, idx) => (
                  <div className="form-group mb-2" key={idx}>
                    <label>{field.replace(/([A-Z])/g, " $1")}</label>
                    <input
                      type={field === "driveDate" ? "date" : "text"}
                      className="form-control"
                      name={field}
                      value={field === "driveDate" ? editableData[field]?.split("T")[0] : editableData[field]}
                      onChange={handleInputChange}
                    />
                  </div>
                ))}
                <div className="form-group mb-2">
                  <label>Description</label>
                  <textarea className="form-control" name="description" value={editableData.description} onChange={handleInputChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={handleUpdate}>Save Changes</button>
                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
