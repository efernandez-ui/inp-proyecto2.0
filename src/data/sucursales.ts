export type Sucursal = {
  name: string
  type: string
  address: string
  phone: string
  directionsUrl: string
  mapSrc: string
}

export const SUCURSALES: Sucursal[] = [
  {
    name: 'Reconquista',
    type: 'Administración Central',
    address: 'Belgrano 777 Dpto. "D" (S3560AXO) - Reconquista - Santa Fe',
    phone: '03482 421130 421123',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Belgrano%20777%2C%20Reconquista%2C%20Santa%20Fe',
    mapSrc:
      'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d13938.647244375865!2d-59.646212!3d-29.1451639!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0xe8f65a18dc9c8547!2sIntercap+S.R.L+-+Casa+Central!5e0!3m2!1ses-419!2sar!4v1539381516854',
  },
  {
    name: 'Buenos Aires',
    type: 'Centro de Distribución',
    address: 'Lagos García 4470 - B1839 9 de Abril - Buenos Aires',
    phone: '11-4357-2232/33',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Lagos%20Garcia%204470%2C%209%20de%20Abril%2C%20Buenos%20Aires',
    mapSrc:
      'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d13110.03279340287!2d-58.4804526!3d-34.7679796!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcd17940c9363d%3A0x665e4885122d29e3!2sIntercap%20S.R.L%20-%20Centro%20de%20distribuci%C3%B3n!5e0!3m2!1ses!2sar!4v1694433107351!5m2!1ses!2sar',
  },
  {
    name: 'Tucumán',
    type: 'Almacén',
    address: 'Mendoza 2050 (T4000DBP) - S.M. de Tucumán - Tucumán',
    phone: '0381 4238888 / 4326007',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Mendoza%202050%2C%20San%20Miguel%20de%20Tucuman%2C%20Tucuman',
    mapSrc:
      'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d14242.098596539192!2d-65.2276839!3d-26.8232604!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0xcb278c221a7a5ede!2sIntercap+S.R.L+-+Deposito+Tucuman!5e0!3m2!1ses-419!2sar!4v1539382457490',
  },
  {
    name: 'Resistencia',
    type: 'Almacén',
    address: 'Santa María de Oro 778 (H3500BKP) - Resistencia - Chaco',
    phone: '0362 4421130 / 4425777',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Santa%20Maria%20de%20Oro%20778%2C%20Resistencia%2C%20Chaco',
    mapSrc:
      'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d14161.646031947435!2d-58.9942369!3d-27.4564454!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x65a0928ee0f4ec2!2sIntercap+S.R.L+-+Deposito+Resistencia!5e0!3m2!1ses-419!2sar!4v1539382262265',
  },
  {
    name: 'Mendoza',
    type: 'Almacén',
    address: 'Adolfo Calle 470 (M5526BDJ) - Dorrego, Guaymallén - Mendoza',
    phone: '0261 8018005',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Adolfo%20Calle%20470%2C%20Guaymallen%2C%20Mendoza',
    mapSrc:
      'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d13399.758273918875!2d-68.83084!3d-32.899766!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0xb6f70603b9a6ccd3!2sIntercap+S.R.L+-+Deposito+Mendoza!5e0!3m2!1ses-419!2sar!4v1539381882515',
  },
]
