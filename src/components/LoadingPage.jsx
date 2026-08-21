import React from "react";

function LoadingPage() {
  return (
    <div className="card-load">
      <div className="d-flex justify-content-center w-100">
        <div className="page-load row">
          <div className="loader " />
          <div className="loader-text" />
        </div>
      </div>
    </div>
  );
}

export default LoadingPage;
