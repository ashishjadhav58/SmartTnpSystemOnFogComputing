import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function Tpresouce() {
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({
    resourceName: "",
    description: "",
    category: "",
    driveLink: "",
    uploadedBy: "",
    uploadDate: "",
  });
  const backendUrl = useSelector((state) => state.backend.backendUrl);
  const [editingResource, setEditingResource] = useState(null);

  useEffect(() => {
    if (!backendUrl) return; // wait for backendUrl to be ready

    const fetchResources = async () => {
      try {
        
         const res = await axios.post(`${backendUrl}/api/resoucess`);

        console.log("Fetched resources:", res.data);
        setResources(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching resources:", err);
      }
    };

    fetchResources();
  }, [backendUrl]);

  const handleChange = (e, isEditing = false) => {
    const { name, value } = e.target;
    if (isEditing) {
      setEditingResource((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewResource((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addResource = async () => {
    try {
      const res = await axios.post(`${backendUrl}/api/resouces`, newResource);
      setResources((prev) => [...prev, res.data]);
      setNewResource({
        resourceName: "",
        description: "",
        category: "",
        driveLink: "",
        uploadedBy: "",
        uploadDate: "",
      });
    } catch (err) {
      console.error("Error adding resource:", err);
    }
  };

  const startEdit = (res) => {
    setEditingResource({ ...res });
  };

  const cancelEdit = () => {
    setEditingResource(null);
  };

  const saveEdit = async () => {
    try {
      await axios.put(`${backendUrl}/api/resouces/${editingResource._id}`, editingResource);
      setResources((prev) =>
        prev.map((r) => (r._id === editingResource._id ? editingResource : r))
      );
      setEditingResource(null);
    } catch (err) {
      console.error("Error updating resource:", err);
    }
  };

  const ResourceCard = ({ res }) => (
    <div className="card m-2 p-3 shadow" style={{ width: "250px" }}>
      <h5>{res.resourceName}</h5>
      <p>
        <strong>Category:</strong> {res.category}
      </p>
      <p>
        <strong>Uploaded by:</strong> {res.uploadedBy}
      </p>
      <p>
        <strong>Date:</strong> {new Date(res.uploadDate).toDateString()}
      </p>
      <a href={res.driveLink} target="_blank" rel="noopener noreferrer">
        View Resource
      </a>
      <br />
      <button className="btn btn-sm btn-outline-secondary mt-2" onClick={() => startEdit(res)}>
        Edit
      </button>
    </div>
  );

  return (
    <div className="container text-center">
      <h4 className="mt-4">Learning Resources</h4>

      {/* Add New Resource */}
      <div className="card p-3 mb-4">
        <h5>Add New Resource</h5>
        <div className="row">
          {[
            "resourceName",
            "category",
            "uploadedBy",
            "driveLink",
            "uploadDate",
            "description",
          ].map((field, idx) => (
            <div key={idx} className={field === "description" ? "col-12 mb-2" : "col-md-4 mb-2"}>
              {field === "description" ? (
                <textarea
                  className="form-control"
                  name={field}
                  placeholder="Description"
                  value={newResource[field]}
                  onChange={handleChange}
                />
              ) : (
                <input
                  type={field === "uploadDate" ? "date" : "text"}
                  className="form-control"
                  name={field}
                  placeholder={field === "uploadDate" ? "Upload Date" : field.replace(/([A-Z])/g, " $1")}
                  value={newResource[field]}
                  onChange={handleChange}
                />
              )}
            </div>
          ))}
          <div className="col-12">
            <button className="btn btn-primary" onClick={addResource}>
              Add Resource
            </button>
          </div>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="d-flex flex-wrap">
        {resources.length > 0 ? (
          resources.map((res) => <ResourceCard key={res._id} res={res} />)
        ) : (
          <p>No resources available.</p>
        )}
      </div>

      {/* Edit Modal */}
      {editingResource && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content p-3">
              <div className="modal-header">
                <h5 className="modal-title">Edit Resource - {editingResource.resourceName}</h5>
                <button type="button" className="btn-close" onClick={cancelEdit}></button>
              </div>
              <div className="modal-body">
                {[
                  "resourceName",
                  "category",
                  "uploadedBy",
                  "driveLink",
                  "uploadDate",
                  "description",
                ].map((field, idx) => (
                  <div className="form-group mb-2" key={idx}>
                    <label>{field.replace(/([A-Z])/g, " $1")}</label>
                    {field === "description" ? (
                      <textarea
                        className="form-control"
                        name={field}
                        value={editingResource[field]}
                        onChange={(e) => handleChange(e, true)}
                      />
                    ) : (
                      <input
                        type={field === "uploadDate" ? "date" : "text"}
                        className="form-control"
                        name={field}
                        value={
                          field === "uploadDate"
                            ? editingResource[field]?.split("T")[0]
                            : editingResource[field]
                        }
                        onChange={(e) => handleChange(e, true)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={saveEdit}>
                  Save Changes
                </button>
                <button className="btn btn-secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
