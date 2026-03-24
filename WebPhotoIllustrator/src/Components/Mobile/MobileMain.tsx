import React from "react";

export default function Main() {
  return (
    <div className="main-container">
      <section id="section1" className="section roboto-font d-flex flex-row">
        <p className='sum1'>Войдите,<br/>чтобы найти<br/>свой стиль</p>
        <div className='regForm d-flex align-items-center flex-column p-5'>
          <span className='logoBg d-flex justify-content-center align-items-center'><img className='logoIcon p-1' src='/Images/logo.png' alt='logo' /></span>
          <form>
            <div className="row mb-3">
              <label htmlFor="inputEmail3" className="col-sm-2 col-form-label" style={{ color: "green" }}>Email</label>
              <div className="col-sm-10">
                <input type="email" className="form-control" id="inputEmail3"/>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Sign in</button>
          </form>
        </div>
      </section>
      <section id="section2" className="section">
        <h1>Section 2</h1>
        <p>Content for section 2...</p>
      </section>
      <section id="section3" className="section">
        <h1>Section 3</h1>
        <p>Content for section 3...</p>
      </section>
      <section id="section4" className="section">
        <h1>Section 4</h1>
        <p>Content for section 4...</p>
      </section>
    </div>
  );
}