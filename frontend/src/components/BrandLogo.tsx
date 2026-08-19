import logoAgendaPro from "../assets/logo-agendapro.svg";

function BrandLogo() {
  return (
    <div className="brand">
      <img
        src={logoAgendaPro}
        alt=""
        className="brand-symbol"
      />

      <h1 className="brand-name">
        Agenda<span>Pro</span>
      </h1>
    </div>
  );
}

export default BrandLogo;