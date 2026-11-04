const pageTitleClass = 'text-2xl font-black tracking-tight text-[#312782] sm:text-3xl';
const sectionTitleClass = 'text-lg font-bold text-[#312782] sm:text-xl';

export default function SobreNosotrosSection() {
  return (
    <section>
      <header className="border-b border-slate-200 pb-5">
        <h1 className={pageTitleClass}>Sobre Nosotros</h1>
      </header>
      <div className="space-y-6 pt-7 text-sm leading-7 text-slate-700 sm:text-base">
        <p>
          <strong className="text-[#312782]">
            “Escuchar al cliente para mejorar continuamente”.
          </strong>{' '}
          En esto se basa nuestra receta, tan simple como infalible. Por esto más de 1.500 casas de
          repuestos de motos de todo el país nos eligen habitualmente hace más de 30 años.
        </p>

        <div>
          <h2 className={sectionTitleClass}>Cómo trabajamos</h2>
          <p className="mt-2">
            Nos impulsa estar adelante en tecnología para agilizar procesos comerciales y logísticos:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>Portal web</strong> con el catálogo más completo del mercado, herramientas de
              autogestión para agilizar los negocios y una experiencia de compra profesional.
            </li>
            <li>
              Soluciones de pagos y envíos para nuestros clientes. Brindamos un servicio completo
              para que puedan realizar cobros con tarjetas en sus mostradores bajando cargas
              financieras y administrativas.
            </li>
            <li>Atención personal a cargo de una fuerza de ventas especializada.</li>
            <li>
              Cuatro sucursales localizadas estratégicamente para llegar rápidamente a cualquier
              punto del país.
            </li>
            <li>
              Centro de distribución central de 5000 m2 con avanzados sistemas de almacenaje.
            </li>
            <li>Software CRM para sistematizar y mejorar la atención a los clientes.</li>
          </ul>
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-6">
          <h2 className={sectionTitleClass}>Nuestra historia</h2>
          <p>
            Los argentinos amamos las motos y éstas no pueden funcionar sin repuestos de calidad en
            el momento y el lugar indicado. Decididos a ser protagonistas de un mercado en
            expansión, desde 1991 nos dedicamos a la distribución mayorista de motopartes. Primero,
            como distribuidores de lubricantes AMA en la región noreste del país desde nuestro
            depósito en la ciudad de Resistencia. Más adelante fuimos sumando líneas de productos que
            hasta el día de hoy nos identifican, como en 1996 cuando sumamos a Pirelli a nuestra
            cartera de productos, a partir de lo cual nos fuimos erigiendo en líderes del mercado de
            neumáticos. En 1998 abrimos una segunda sucursal en Tucumán continuando con nuestra
            expansión allí donde se respira moto.
          </p>
          <p>
            En el año 2000 la apertura de un depósito en Buenos Aires fue la llave de acceso a todo
            el país, tanto para llegar rápidamente a los clientes como para apoyar a las sucursales
            del interior. Inicialmente nos instalamos en CABA, pero el crecimiento fue rápido y nos
            mudamos a Lanús en 2002 y en 2022 a Esteban Echeverría ampliando la superficie y
            mejorando los sistemas de almacenaje.
          </p>
          <p>
            En 2005 abrimos una sucursal en la ciudad de Mendoza, siguiendo nuestra premisa de estar
            cerca de nuestros clientes.
          </p>
          <p>
            A lo largo de este tiempo hemos adquirido la experiencia y el talento para brindar el
            servicio que nuestros clientes esperan para un crecimiento conjunto de los negocios.
            También forjamos alianzas sustentables con proveedores locales y extranjeros.
          </p>
          <p>
            Nada hubiera sido posible sin el excepcional grupo humano que conforma a Intercap desde
            sus inicios y que progresivamente se amplía. Aprendiendo de los errores y escuchando a
            quienes más saben, nuestros clientes, nos entusiasma saber que esta historia sigue
            escribiéndose.
          </p>
        </div>
      </div>
    </section>
  );
}
