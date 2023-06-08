import React, { useEffect, useState, useRef } from "react";
import Layout from "@/layout/layout"
import axios from "axios";
//--> Componentes primeReact
import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { FileUpload } from 'primereact/fileupload';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
//--> Funciones propias
import { objetoVacio } from "@/components/catalogos/objetovacio";
import { formatoPrecio } from "@/helpers/funciones";
import { camposVacios } from "@/components/mensajesNotificaciones/mensajes";
import { listaTipos } from "@/components/catalogos/listas";
import { consultarProductos, crearProducto, editarProducto, eliminarProducto } from "@/components/mensajesNotificaciones/links";

const CatalogoFlores = () => {
  // Token generado desde el login
  let valorToken

  //--> Estructura de objeto vacio
  let productoVacio = objetoVacio

  //----------------| Lista de variables |----------------
  //--> Registros
  const [product, setProduct] = useState(productoVacio);
  const [products, setProducts] = useState(null);
  //--> Edicion
  const [nombreNuevo, setNombreNuevo] = useState('')
  //--> Dialogos
  const [productDialog, setProductDialog] = useState(false);
  const [deleteProductDialog, setDeleteProductDialog] = useState(false);
  const [deleteProductsDialog, setDeleteProductsDialog] = useState(false);
  //--> Otros
  const [editar, setEditar] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);
  //--> Mensajes
  const [mensajeRespuesta, setMensajeRespuesta] = useState('')
  //--> Especiales
  const toast = useRef(null);
  const dt = useRef(null);

  //----------------| Interaccion con back-end |----------------
  //--> GET
  const obtenerProductos = async () => {
    console.log("Obteniendo productos...")
    try {
      const datos = await axios.get(consultarProductos)
      // console.log(datos.data.products)
      setProducts(datos.data.products)
    } catch (error) { console.log(error) }
  }

  //--> POST
  const crearProducto = async (productoNuevo) => {
    console.log("Creando producto...")
    //--> Validar envio
    if (Object.values(productoNuevo).includes('')) {
      setMensajeRespuesta(camposVacios)
      setTimeout(() => { setMensajeRespuesta('') }, 3000)
      return
    }

    //--> Preparar envio back-end
    const token = localStorage.getItem('token')
    const cabecera = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
    try {
      const respuesta = await axios.post("http://localhost:27017/api/productos", productoNuevo, cabecera)
      setTimeout(() => {
        obtenerProductos()
        toast.current.show({
          severity: 'success', summary: `${respuesta.data.msg}`, life: 3000
        });
      }, 6000);

      cerrarDialogoCM()
      setProduct(productoVacio)
    } catch (error) {
      console.log(error.response.data)
      setMensajeRespuesta(error.response.data)
      setTimeout(() => { setMensajeRespuesta('') }, 3000);
    }
  }

  //--> PUT
  const actualizarProducto = async (productoEditar) => {
    console.log("Actualizando...")

    //--> Validar antes de enviar
    if (Object.values(productoEditar).includes('') || nombreNuevo === '') {
      setMensajeRespuesta(camposVacios)
      setTimeout(() => { setMensajeRespuesta('') }, 3000);
      return
    }

    //--> Preparar objeto para enviar
    const token = localStorage.getItem('token')
    const cabecera = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
    const objetoEnviar = {
      nombreProducto: product.nombreProducto,
      nuevoNombre: nombreNuevo,
      descrProducto: product.descrProducto,
      tipoProducto: product.tipoProducto,
      precioProducto: product.precioProducto,
      cantidadInv: product.cantidadInv,
      categoriaProducto: product.categoriaProducto,
      imagenesAdd: [],
      imagenesRem: []
    }
    //--> Mandar objeto al back-end
    try {
      const respuesta = await axios.post(editarProducto, objetoEnviar, cabecera)
      toast.current.show({
        severity: 'success', summary: `${respuesta.data.msg}`, life: 3000
      });
      cerrarDialogoCM()

      //--> Limpieza
      setProduct(productoVacio)
      setNombreNuevo('')

      //--> Renderizar despues de enviar
      obtenerProductos()
    } catch (error) {
      console.log(error.response.data)
      setMensajeRespuesta(error.response.data)
      setTimeout(() => { setMensajeRespuesta('') }, 3000);
    }
  }

  //--> DELETE
  const quitarProducto = async () => {
    console.log("Eliminando producto...")
    console.log(product)
    //--> Crear objeto a eliminar
    const objetoEliminar = { nombreProducto: product.nombreProducto }
    const token = localStorage.getItem('token')
    const cabecera = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
    //--> Mandar objeto a back-end
    try {
      const respuesta = await axios.post(eliminarProducto, objetoEliminar, cabecera)
      console.log(respuesta.data.msg)
      toast.current.show({
        severity: 'success', summary: `${respuesta.data.msg}`, life: 3000
      });

      //--> Leer productos otra vez
      obtenerProductos()
      //--> Cerrar dialogo
      cerrarDialogoEliminarRegistro()
    } catch (error) {
      console.log(error.response.data)
      setMensajeRespuesta(error.response.data)
      setTimeout(() => { setMensajeRespuesta('') }, 3000);
    }
  }

  //----------------| Renderizado |----------------
  //--> Cargar cuando se renderiza
  useEffect(() => { obtenerProductos() }, []);

  //--> Revisar si es editar o crear producto
  useEffect(() => {
    if (product._id) setEditar(true)
    else setEditar(false)
  }, [product])

  //----------------| Interaccion con dialogos |----------------
  const abrirDialogoCM = () => {
    setProduct(productoVacio);
    setNombreNuevo('')
    setProductDialog(true);
  };

  const cerrarDialogoCM = () => { setProductDialog(false) };

  const cerrarDialogoEliminarRegistro = () => { setDeleteProductDialog(false) };

  const cerrarDialogoEliminarRegistros = () => { setDeleteProductsDialog(false) }

  //----------------| Funcion CRUD |----------------
  const guardarRegistro = async () => {
    //--> Editar registro
    if (product._id) { actualizarProducto(product) }

    //--> Crear registro
    else { crearProducto(product) }
  };

  const editarRegistro = (product) => {
    setProduct({ ...product });
    setProductDialog(true);
  };

  const confirmarEliminarRegistro = (product) => {
    setProduct(product);
    setDeleteProductDialog(true);
  };

  const exportCSV = () => { dt.current.exportCSV() }

  const confirmDeleteSelected = () => { setDeleteProductsDialog(true) }

  //--> DELETE
  const deleteSelectedProducts = () => {
    //--> Preparar objeto para mandar al back-end
    const token = localStorage.getItem('token')
    const cabecera = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
    //--> Listar los productos eliminados
    selectedProducts.map(async registro => {
      try {
        const respuesta = await axios.post(eliminarProducto, { nombreProducto: registro.nombreProducto }, cabecera)
        console.log(respuesta.data.msg)
      } catch (error) {
        console.log(error.response.data)
      }
      finally {
        //--> Leer registros de back-end
        obtenerProductos()
        setDeleteProductsDialog(false);
        setSelectedProducts(null);
      }
    })
    toast.current.show({
      severity: 'success', summary: 'Productos eliminados', detail: 'Se ha eliminados correctamente los productos.', life: 3000
    });
  };

  //----------------| Funciones para editar |----------------
  const cambiarEstatus = (e) => {
    let _product = { ...product };

    _product['estatus'] = e.value;
    setProduct(_product);
  };

  const cambiarString = (e, name) => {
    const val = (e.target && e.target.value) || '';
    let _product = { ...product };
    _product[`${name}`] = val;
    setProduct(_product);
  };

  const cambiarNumero = (e, name) => {
    const val = e.value || 0;
    let _product = { ...product };
    _product[`${name}`] = val;
    setProduct(_product);
  };

  //----------------| Plantillas |----------------
  const plantillaImagen = (rowData) => {
    return <img
      // src={`https://primefaces.org/cdn/primereact/images/product/${rowData.image}`}
      alt={rowData.image} className="shadow-2 border-round" style={{ width: '64px' }} />;
  };

  const plantillaPrecio = (rowData) => { return formatoPrecio(rowData.precioProducto) }
  const plantillaDescuentoPrecio = (rowData) => { return formatoPrecio(rowData.precioDescuento) }
  const plantillaPorcentaje = (rowData) => { return `${rowData.descuentoProducto} %` }
  const plantillaCantiddad = (rowData) => { return `${rowData.cantidadInv} piezas` }

  const ratingBodyTemplate = (rowData) => {
    return <Rating value={rowData.rating} readOnly cancel={false} />;
  };

  const plantillaEstatus = (rowData) => {
    return <Tag value={rowData.statusProducto} severity={getSeverity(rowData)}></Tag>;
  };

  const getSeverity = (product) => {
    switch (product.statusProducto) {
      case 'Disponible': return 'success';
      case 'Pocos': return 'warning';
      case 'Agotado': return 'danger';
      default: return null;
    }
  };

  //----------------| Botones de dialogos |----------------
  const cabezal = (
    <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
      <h4 className="m-0">Control de productos</h4>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar..." />
      </span>
    </div>
  );

  const botonIzquierda = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button label="Nuevo" icon="pi pi-plus" severity="success" onClick={abrirDialogoCM} />
        <Button label="Eliminar" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedProducts || !selectedProducts.length} />
      </div>
    );
  };

  const botonDerecha = () => {
    return <Button label="Exportar" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />;
  };

  const botonesAccion = (rowData) => {
    return (
      <>
        <Button icon="pi pi-pencil" rounded severity="warning" className="mr-2" onClick={() => editarRegistro(rowData)} />
        <Button icon="pi pi-trash" rounded  severity="danger" onClick={() => confirmarEliminarRegistro(rowData)} />
      </>
    );
  };

  const botonesCrearModificar = (
    <> 
      <Button label="Guardar"  severity="success" icon="pi pi-check" onClick={guardarRegistro} />
      <Button label="Cancelar" security="danger" icon="pi pi-times" outlined onClick={cerrarDialogoCM} />
     
    </>
  );

  const botonesEliminarRegistro = (
    <>
    <Button label="Sí" icon="pi pi-check" severity="success" onClick={quitarProducto} />
      <Button label="No" icon="pi pi-times" severity="danger" onClick={cerrarDialogoEliminarRegistro} />
      
    </>
  );

  const botonesEliminarRegistros = (
    <> 
      <Button label="Sí" icon="pi pi-check" severity="success" onClick={deleteSelectedProducts} />
      <Button label="No" icon="pi pi-times" severity="danger" onClick={cerrarDialogoEliminarRegistros} />
     
    </>
  );

  //----------------| Valor que regresara |----------------
  return (
    <Layout
      title="Flores"
      description="Acceso al catálogo de flores"
    >
      <div className="grid">
        <Toast ref={toast} />
        <div className="col-12">
          <div className="card">
            <Toolbar className="mb-4" left={botonIzquierda} right={botonDerecha} />

            <DataTable
              ref={dt} value={products} selection={selectedProducts} onSelectionChange={(e) => setSelectedProducts(e.value)}
              paginator rows={10} rowsPerPageOptions={[5, 10, 25]} showGridlines
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Mostrando {first} - {last} de {totalRecords} registros"
              globalFilter={globalFilter} header={cabezal}
            >
              <Column selectionMode="multiple" exportable={false} />
              <Column field="nombreProducto" header="Nombre" sortable style={{ minWidth: '12rem', textAlign: "center" }} />
              <Column field="descrProducto" header="Descripción" sortable style={{ minWidth: '12rem', textAlign: "center" }} />
              <Column field="tipoProducto" header="Tipo" sortable style={{ minWidth: '12rem', textAlign: "center" }} />
              <Column field="precioProducto" header="Precio" body={plantillaPrecio}
                sortable style={{ minWidth: '12rem', textAlign: "center" }} />
              <Column field="cantidadInv" header="Cantidad" sortable body={plantillaCantiddad}
                style={{ minWidth: '12rem', textAlign: "center" }} />
              <Column field="categoriaProducto" header="Categoría" sortable style={{ minWidth: '12rem', textAlign: "center" }} />
              <Column field="descuentoProducto" header="Descuento" sortable body={plantillaPorcentaje}
                style={{ minWidth: '12rem', textAlign: "center" }} />
              <Column field="precioDescuento" header="Precio de descuento" sortable body={plantillaDescuentoPrecio}
                style={{ minWidth: '12rem', textAlign: "center" }} />
              <Column field="statusProducto" header="Estatus" sortable body={plantillaEstatus}
                style={{ minWidth: '12rem', textAlign: "center" }} />

              {/* <Column field="nombre" header="Nombre" sortable style={{ minWidth: '16rem', textAlign: "center" }} />
              <Column field="precio" header="Precio" body={plantillaPrecio} sortable
                style={{ minWidth: '8rem', textAlign: "center" }} />
              <Column field="categoria" header="Categoria" sortable style={{ minWidth: '10rem', textAlign: "center" }} />
              <Column field="image" header="Imagenes" body={plantillaImagen} />
              <Column field="estatus" header="Estatus" body={plantillaEstatus} sortable
                style={{ minWidth: '12rem', textAlign: "center" }} /> */}
              <Column header="Editar" body={botonesAccion} exportable={false} style={{ minWidth: '12rem' }} />
            </DataTable>

            <Dialog
              visible={productDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Detalles del producto" modal className="p-fluid" footer={botonesCrearModificar} onHide={cerrarDialogoCM}
            >
              {product.image && (
                <img
                  // src={`https://primefaces.org/cdn/primereact/images/product/${product.image}`}
                  alt={product.image} className="product-image block m-auto pb-3" />
              )}
              <div className="field">
                <label htmlFor="nombre" className="font-bold">Nombre</label>
                <InputText
                  id="nombre" value={product.nombreProducto} onChange={(e) => cambiarString(e, 'nombreProducto')}
                  required autoFocus className={classNames({ 'p-invalid': submitted && !product.nombreProducto })}
                />
                {/* {submitted && !product.nombre && <small className="p-error">El nombre es obligatorio.</small>} */}
              </div>
              {editar && (
                <div className="field">
                  <label htmlFor="nombre" className="font-bold">Nuevo nombre</label>
                  <InputText
                    id="nombre" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)}
                    required autoFocus className={classNames({ 'p-invalid': submitted && !product.nombreProducto })}
                  />
                  {/* {submitted && !product.nombre && <small className="p-error">El nombre es obligatorio.</small>} */}
                </div>
              )}
              <div className="field">
                <label htmlFor="descripcion" className="font-bold">Descripción</label>
                <InputText
                  id="nombre" value={product.descrProducto} onChange={(e) => cambiarString(e, 'descrProducto')}
                  required autoFocus className={classNames({ 'p-invalid': submitted && !product.descrProducto })}
                />
              </div>
              <div className="formgrid grid">
                <div className="field col">
                  <label htmlFor="precio" className="font-bold">Precio</label>
                  <InputNumber
                    id="precio" value={product.precioProducto} onValueChange={(e) => cambiarNumero(e, 'precioProducto')}
                    mode="currency" currency="USD" locale="en-US"
                  />
                </div>
                <div className="field col">
                  <label className="font-bold">Tipo de producto</label>
                  <Dropdown
                    value={product.tipoProducto} onChange={(e) => cambiarString(e, 'tipoProducto')}
                    options={listaTipos} optionLabel="nombre" optionValue="valor"
                    placeholder="Elija una categoría" className="w-full md:w-14rem" />
                </div>
              </div>

              <div className="formgrid grid">
                <div className="field col">
                  <label htmlFor="cantidad" className="font-bold">Cantidad</label>
                  <InputNumber
                    id="cantidad" value={product.cantidadInv} onValueChange={(e) => cambiarNumero(e, 'cantidadInv')}
                    suffix=" piezas"
                  />
                </div>
                <div className="field col">
                  <label htmlFor="descuento" className="font-bold">Descuento</label>
                  <InputNumber
                    id="descuento" value={product.descuentoProducto} onValueChange={(e) => cambiarNumero(e, 'descuentoProducto')}
                    suffix=" %"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="categoria" className="font-bold">Categoría</label>
                <InputText
                  id="categoria" value={product.categoriaProducto} onChange={(e) => cambiarString(e, 'categoriaProducto')}
                  required autoFocus className={classNames({ 'p-invalid': submitted && !product.categoriaProducto })}
                />
              </div>

              <div className="flex justify-content-around">
                <FileUpload
                  mode="basic" name="demo[]" url="/api/upload" accept="image/*" maxFileSize={1000000} chooseLabel="Foto 1"
                />
                <FileUpload
                  mode="basic" name="demo[]" url="/api/upload" accept="image/*" maxFileSize={1000000} chooseLabel="Foto 2"
                />
                <FileUpload
                  mode="basic" name="demo[]" url="/api/upload" accept="image/*" maxFileSize={1000000} chooseLabel="Foto 3"
                />
              </div>
              {/* <FileUpload mode="basic" accept="image/*" maxFileSize={1000000}
                auto chooseLabel="Browse" /> */}
              {mensajeRespuesta && (
                <div className="mt-4">
                  <Message severity="error" text={mensajeRespuesta} />
                </div>
              )}

            </Dialog>

            <Dialog
              visible={deleteProductDialog} style={{ width: '32rem' }}
              breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={botonesEliminarRegistro}
              onHide={cerrarDialogoEliminarRegistro}
            >
              <div className="confirmation-content">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                {product && (
                  <span>
                    ¿Está seguro de eliminar <b>{product.nombreProducto}</b>?
                  </span>
                )}
              </div>
            </Dialog>

            <Dialog visible={deleteProductsDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={botonesEliminarRegistros} onHide={cerrarDialogoEliminarRegistros}>
              <div className="confirmation-content">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                {product && <span>¿Está seguro de eliminar los registros?</span>}
              </div>
            </Dialog>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CatalogoFlores