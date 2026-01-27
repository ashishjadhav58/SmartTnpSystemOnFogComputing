let activeJobs = 0;

function handleJob(duration = 10000) {
  activeJobs++;
  console.log("Job started. Active jobs:", activeJobs);

  setTimeout(() => {
    activeJobs--;
    console.log("Job ended. Active jobs:", activeJobs);
  }, duration);
}

function getActiveJobs() {
  return activeJobs;
}

module.exports = {
  handleJob,
  getActiveJobs
};
