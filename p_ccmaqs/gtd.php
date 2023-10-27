<?php

function controller( $args ) {

  if(carga_sesion()) {

    switch( $args[0] ) {

      case 'carga_erp':
        $foo = carga_erp();
        break;

      case 'gtd':
        $foo = gtd('');
        break;

      case 'proyectos':
        $foo = proyectos(false);
        break;

      case 'ins_proyecto':
        $foo = ins_proyecto();
        break;
      case 'upd_proyecto':
        $foo = upd_proyecto();
        break;
      case 'del_proyecto':
        $foo = del_proyecto();
        break;
        
      case 'get_clob_proyecto':
        $foo = get_clob_proyecto();
        break;

      case 'ins_seccion':
        $foo = ins_seccion();
        break;
      case 'upd_seccion':
        $foo = upd_seccion();
        break;
      case 'del_seccion':
        $foo = del_seccion();
        break;
      
      case 'tareas':
        $foo = tareas(false);
        break;

      case 'ins_tarea':
        $foo = ins_tarea();
        break;
      case 'upd_tarea':
        $foo = upd_tarea();
        break;
      case 'del_tarea':
        $foo = del_tarea();
        break;

      case 'get_clob_tarea':
        $foo = get_clob_tarea();
        break;
      
      case 'ins_tarea_documento':
        $foo = ins_tarea_documento();
        break;
      case 'del_tarea_documento':
        $foo = del_tarea_documento();
        break;
      case 'set_tarea_campo_aux':
        $foo = set_tarea_campo_aux();
        break;
      
      case 'upd_tarea_seccion':
        $foo = upd_tarea_seccion(false);
        break;
      
      case 'upd_subtarea_orden':
        $foo = upd_subtarea_orden();
        break;

      case 'upd_etiqueta':
        $foo = upd_etiqueta();
        break;
      case 'ins_tarea_etiqueta':
        $foo = ins_tarea_etiqueta();
        break;
      case 'del_tarea_etiqueta':
        $foo = del_tarea_etiqueta();
        break;

      case 'ins_tarea_comentario':
        $foo = ins_tarea_comentario();
        break;
      case 'del_tarea_comentario':
        $foo = del_tarea_comentario();
        break;

      case 'set_campo_aux':
        $foo = set_campo_aux();
        break;
      case 'upd_campo_aux':
        $foo = upd_campo_aux();
        break;
      case 'del_campo_aux':
        $foo = del_campo_aux();
        break;

      case 'set_proyecto_permiso':
        $foo = set_proyecto_permiso();
        break;
      case 'upd_proyecto_permiso':
        $foo = upd_proyecto_permiso();
        break;
      case 'del_proyecto_permiso':
        $foo = del_proyecto_permiso();
        break;

      case 'set_opcion_usuario':
        $foo = set_opcion_usuario();
        break;
      case 'set_opcion_usuario_seccion':
        $foo = set_opcion_usuario_seccion();
        break;
      default:
        $foo = '"resultado":"NO_OK","mensaje":"No se ha definido el controlador"';

    }

  }

  return $foo;

}


function carga_erp() {

  $cnx = sql_connect();

  $mwl = $_SESSION[_DEF_SESSION_NAME];

  $modulo = 'gtd';

  $out = load_erp($modulo, $cnx);

  $menu = $_SESSION[_DEF_SESSION_NAME.'-'.$GLOBALS['modulo']]['menu'];
  $pass = ($menu['password'] == '') ? 'N' : 'S';
  $out .= '"password": "'.$pass.'",';

  $out .= '"resultado": "OK"';

  return $out;

}

function gtd($proyecto) {

  $out = '"gtd":{';
  $out .= proyectos(true);
  $out .= tareas(true, $proyecto);
  $out .= etiquetas(true);
  $out .= permisos();
  $out .= '},"resultado": "OK"';

  return $out;

}

function permisos() {

  $cnx = sql_connect();

  $out = '"permisos":{';

  // usuarios

  $sql = "SELECT gt.usuario, gt.d_usuario, SUM(gt.num_tareas_responsable) num_tareas_responsable FROM TABLE(pk_web_gtd_xe.get_gtd_usuarios_proyecto()) gt GROUP BY gt.usuario, gt.d_usuario";
  $exec = oci_parse($cnx, $sql);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"usuarios":{';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '"_'.$row['usuario'].'":{"nombre":"'.convertirhtml($row['d_usuario']).'","num_tareas_responsable":"'.$row['num_tareas_responsable'].'"}';
    $rc = true;
  }
  $out .= '},';

  // perfiles

  $sql = "SELECT gt.perfil, gt.d_perfil FROM TABLE(pk_web_gtd_xe.get_gtd_usuarios_proyecto()) gt WHERE gt.perfil IS NOT NULL AND gt.perfil != 'NULL' GROUP BY gt.perfil, gt.d_perfil";
  $exec = oci_parse($cnx, $sql);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"perfiles":{';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '"_'.$row['perfil'].'":"'.convertirhtml($row['d_perfil']).'"';
    $rc = true;
  }
  $out .= '},';

  // equipos

  $sql = "SELECT gt.equipo, gt.d_equipo FROM TABLE(pk_web_gtd_xe.get_gtd_usuarios_proyecto()) gt WHERE gt.equipo IS NOT NULL AND gt.equipo != 'NULL' GROUP BY gt.equipo, gt.d_equipo";
  $exec = oci_parse($cnx, $sql);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"equipos":{';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '"_'.$row['equipo'].'":"'.convertirhtml($row['d_equipo']).'"';
    $rc = true;
  }
  $out .= '}';

  $out .= '}';

  return $out;

}

function proyectos($init) {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $out = '';

  $sql = "SELECT gt.codigo, gt.tipo, gt.nombre, gt.supervisor, TO_CHAR(gt.fecha_entrega, pk_web_general.get_nls_date_format()) fecha_entrega, gt.status, gt.color, gt.icono, gt.publico, gt.gestiona_expedientes FROM TABLE(pk_web_gtd_xe.get_gtd_proyectos_pipe()) gt ORDER BY DECODE(gt.tipo, 'U', -1, 0), gt.status, gt.nombre";
  $exec = oci_parse($cnx, $sql);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"proyectos":[';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '{"codigo":'.$row['codigo'].',"nombre":"'.convertirhtml($row['nombre']).'","status":"'.$row['status'].'"';
    if($row['tipo'] != 'P') $out .= ',"tipo":"'.$row['tipo'].'"';
    if($row['supervisor'] != '') $out .= ',"supervisor":"'.$row['supervisor'].'"';
    if($row['fecha_entrega'] != '') $out .= ',"fecha_entrega":"'.$row['fecha_entrega'].'"';
    if($row['color'] != '') $out .= ',"color":"'.$row['color'].'"';
    if($row['icono'] != '') $out .= ',"icono":"'.$row['icono'].'"';
    if($row['gestiona_expedientes'] != '') $out .= ',"gestiona_expedientes":"'.$row['gestiona_expedientes'].'"';
    $out .= secciones_proyecto( $row['codigo'] );
    $out .= campos_aux_proyecto( $row['codigo'] );
    $out .= usuarios_proyecto( $row['codigo'] );
    $out .= '}';
    $rc = true;
  }

  $out .= '],';

  if(!$init) $out .= '"resultado": "OK"';

  return $out;

}

function ins_proyecto() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $nombre = $_POST['p_nombre'];
  $descripcion = $_POST['p_descripcion'] ?? '';
  $publico = $_POST['p_publico'] ?? '';
  $color = $_POST['p_color'] ?? '';
  $icono = $_POST['p_icono'] ?? '';
  $gestiona_expedientes = $_POST['p_gestiona_expedientes'] ?? '';

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.ins_gtd_proyecto(p_nombre => :nombre, p_descripcion => :descripcion, p_publico => :publico, p_color => :color, p_icono => :icono, p_gestiona_expedientes => :gestiona_expedientes, p_out_proyecto => :codigo); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":nombre", $nombre, 100);
  oci_bind_by_name($exec, ":descripcion", $descripcion, 4000);
  oci_bind_by_name($exec, ":publico", $publico, 1);
  oci_bind_by_name($exec, ":color", $color, 100);
  oci_bind_by_name($exec, ":icono", $icono, 100);
  oci_bind_by_name($exec, ":gestiona_expedientes", $gestiona_expedientes, 1);
  oci_bind_by_name($exec, ":codigo", $codigo, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"codigo":'.$codigo.',' . gtd($codigo);

  return $out;

}

function upd_proyecto() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $proyecto = $_POST['proyecto'];
  $campo = $_POST['campo'];
  $valor = $_POST['valor'] ?? '';
  $valor_clob = $_POST['valor_clob'] ?? '';

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.upd_gtd_proyecto(p_proyecto => :proyecto, p_campo => :campo, p_valor => :valor, p_valor_clob => :valor_clob); END;";
  $exec = oci_parse($cnx, $sql);
  $lob = oci_new_descriptor($cnx, OCI_D_LOB);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":campo", $campo, 100);
  oci_bind_by_name($exec, ":valor", $valor, 4000);
  oci_bind_by_name($exec, ":valor_clob",  $lob, -1, OCI_B_CLOB);
  $lob->writeTemporary($valor_clob, OCI_TEMP_CLOB);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"OK"';

  return $out;

}


function del_proyecto() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $proyecto = $_POST['proyecto'];

  $out = '';

  $sql = "BEGIN :rdo := pk_web_gtd_xe.del_gtd_proyecto(p_proyecto => :proyecto); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":rdo", $rdo, 10);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"'.$rdo.'"';

  return $out;

}

function get_clob_proyecto() {

  $cnx = sql_connect();

  $proyecto = $_POST['proyecto'];

  session_write_close();

  $lob = oci_new_descriptor($cnx, OCI_D_LOB);
  $sql = "BEGIN :clob := pk_web_gtd_xe.get_clob_proyecto(p_proyecto => :proyecto); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ':clob', $lob, -1, OCI_B_CLOB);
  if(!oci_execute($exec, OCI_DEFAULT)) return oci_execute_error($exec);

  $foo = '';
  if($lob) {
    while(!$lob->eof()){
      $foo .= $lob->read(2000);
    }
    $lob->free();
  }

  $out = '"resultado":"OK","datos":"'.convertirhtml($foo).'"';

  return $out;

}

function secciones_proyecto($proyecto) {

  $cnx = sql_connect();

  $out = '';

  $sql = "SELECT gt.codigo, gt.nombre, gt.orden, gt.color, gt.minimo_tareas, gt.maximo_tareas, gt.observaciones, gt.columnas FROM TABLE(pk_web_gtd_xe.get_gtd_secciones_pipe(p_proyecto => :proyecto)) gt ORDER BY gt.orden";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= ',"secciones":[';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '{"codigo":'.$row['codigo'].',"nombre":"'.convertirhtml($row['nombre']).'","orden":'.$row['orden'];
    if($row['color'] != '') $out .= ',"color":"'.$row['color'].'"';
    if($row['minimo_tareas'] != '') $out .= ',"minimo_tareas":"'.$row['minimo_tareas'].'"';
    if($row['maximo_tareas'] != '') $out .= ',"maximo_tareas":"'.$row['maximo_tareas'].'"';
    if($row['observaciones'] != '') $out .= ',"observaciones":"'.$row['observaciones'].'"';
    if($row['columnas'] != '') $out .= ',"columnas":"'.$row['columnas'].'"';
    $out .= '}';
    $rc = true;
  }

  $out .= ']';

  return $out;

}

function ins_seccion() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $proyecto = $_POST['proyecto'];
  $nombre = $_POST['nombre'];

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.ins_gtd_seccion(p_proyecto => :proyecto, p_nombre => :nombre, p_out_seccion => :codigo, p_out_orden => :orden); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":nombre", $nombre, 100);
  oci_bind_by_name($exec, ":codigo", $codigo, 20);
  oci_bind_by_name($exec, ":orden", $orden, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"codigo":'.$codigo.',"orden":'.$orden.',"resultado":"OK"';

  return $out;

}

function upd_seccion() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $seccion = $_POST['codigo'];
  $proyecto = $_POST['proyecto'];
  $campo = $_POST['campo'];
  $valor = $_POST['valor'] ?? '';

  $recargar = $_POST['recargar'] ?? 'N';

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.upd_gtd_seccion(p_seccion => :seccion, p_proyecto => :proyecto, p_campo => :campo, p_valor => :valor); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":seccion", $seccion, 20);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":campo", $campo, 100);
  oci_bind_by_name($exec, ":valor", $valor, 4000);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  if($recargar != 'S') {
    $out = '"resultado":"OK"';
  } else {
    $out = gtd($proyecto);
  }

  return $out;

}

function del_seccion() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $codigo = $_POST['codigo'];
  $proyecto = $_POST['proyecto'];
  $seccion_mover_tareas = $_POST['seccion_mover_tareas'] ?? '';

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.del_gtd_seccion(p_seccion => :codigo, p_proyecto => :proyecto, p_seccion_mover_tareas => :seccion_mover_tareas); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":codigo", $codigo, 20);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":seccion_mover_tareas", $seccion_mover_tareas, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = gtd($proyecto);

  return $out;

}

function tareas($init, $proyecto = '', $etiqueta = '') {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $proyecto = $_POST['proyecto'] ?? $proyecto;
  $etiqueta = $_POST['etiqueta'] ?? $etiqueta;
  
  $tarea = $_POST['tarea'] ?? '';

  $filtro_status_tarea = $_POST['filtro_status_tarea'] ?? '';
  $filtro_texto = $_POST['filtro_texto'] ?? '';
  $filtro_usuario_responsable = $_POST['filtro_usuario_responsable'] ?? '';
  $filtro_fecha = $_POST['filtro_fecha'] ?? '';

  $out = '';

  $sql = "SELECT gt.codigo, gt.nombre, gt.usuario_responsable, TO_CHAR(gt.fecha_inicio, pk_web_general.get_nls_date_format()) fecha_inicio, TO_CHAR(gt.fecha_entrega, pk_web_general.get_nls_date_format()) fecha_entrega, gt.descripcion, gt.status, gt.prioridad, gt.tarea_padre, gt.depende_de_tarea, TO_CHAR(gt.fecha_grabacion, pk_web_general.get_nls_date_format() || ' HH24:MI') fecha_grabacion, gt.usuario_grabacion, gt.crm_numero_expediente, gt.crm_numero_linea, TO_CHAR(gt.fecha_finalizacion, pk_web_general.get_nls_date_format()) fecha_finalizacion, gt.usuario_finalizacion FROM TABLE(pk_web_gtd_xe.get_gtd_tareas_pipe(p_proyecto => :proyecto, p_etiqueta => :etiqueta, p_tarea => :tarea, p_filtro_status_tarea => :filtro_status_tarea, p_filtro_texto => :filtro_texto, p_filtro_usuario_responsable => :filtro_usuario_responsable, p_filtro_fecha => :filtro_fecha)) gt ORDER BY NVL(gt.tarea_padre, gt.codigo), gt.codigo";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":etiqueta", $etiqueta, 20);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  oci_bind_by_name($exec, ":filtro_status_tarea", $filtro_status_tarea, 1);
  oci_bind_by_name($exec, ":filtro_texto", $filtro_texto, 20);
  oci_bind_by_name($exec, ":filtro_usuario_responsable", $filtro_usuario_responsable, 20);
  oci_bind_by_name($exec, ":filtro_fecha", $filtro_fecha, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"tareas":[';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '{"codigo":'.$row['codigo'].',"nombre":"'.convertirhtml($row['nombre']).'","status":"'.$row['status'].'"';
    if($row['usuario_responsable'] != '') $out .= ',"usuario_responsable":"'.$row['usuario_responsable'].'"';
    if($row['fecha_inicio'] != '') $out .= ',"fecha_inicio":"'.$row['fecha_inicio'].'"';
    if($row['fecha_entrega'] != '') $out .= ',"fecha_entrega":"'.$row['fecha_entrega'].'"';
    if($row['prioridad'] != '') $out .= ',"prioridad":"'.$row['prioridad'].'"';
    if($row['tarea_padre'] != '') $out .= ',"tarea_padre":'.$row['tarea_padre'];
    if($row['depende_de_tarea'] != '') $out .= ',"depende_de_tarea":'.$row['depende_de_tarea'];
    if($row['fecha_grabacion'] != '') $out .= ',"fecha_grabacion":"'.$row['fecha_grabacion'].'"';
    if($row['usuario_grabacion'] != '') $out .= ',"usuario_grabacion":"'.$row['usuario_grabacion'].'"';
    if($row['crm_numero_expediente'] != '') $out .= ',"crm_numero_expediente":"'.$row['crm_numero_expediente'].'"';
    if($row['crm_numero_linea'] != '') $out .= ',"crm_numero_linea":"'.$row['crm_numero_linea'].'"';
    if($row['fecha_finalizacion'] != '') $out .= ',"fecha_finalizacion":"'.$row['fecha_finalizacion'].'"';
    if($row['usuario_finalizacion'] != '') $out .= ',"usuario_finalizacion":"'.$row['usuario_finalizacion'].'"';
    $out .= secciones_tarea( $row['codigo'] );
    $out .= subtareas( $row['codigo'] );
    $out .= tarea_documentos( $row['codigo'] );
    $out .= tarea_etiquetas( $row['codigo'] );
    $out .= tarea_comentarios( $row['codigo'] );
    $out .= tarea_campos_aux( $row['codigo'] );
    $out .= '}';
    $rc = true;
  }

  $out .= '],';

  if(!$init) $out .= '"resultado": "OK"';

  return $out;

}

function secciones_tarea($tarea) {

  $cnx = sql_connect();

  $out = '';

  $sql = "SELECT gt.proyecto, gt.seccion, gt.orden FROM TABLE(pk_web_gtd_xe.get_gtd_tarea_secciones_pipe(p_tarea => :tarea)) gt ORDER BY gt.proyecto, gt.orden";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= ',"secciones":{';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '"'.$row['proyecto'].'":{"seccion":'.$row['seccion'].',"orden":'.$row['orden'].'}';
    $rc = true;
  }

  $out .= '}';

  return $out;

}

function subtareas($tarea) {

  $cnx = sql_connect();

  $out = '';

  $sql = "SELECT gt.subtarea, gt.orden FROM TABLE(pk_web_gtd_xe.get_gtd_subtareas_pipe(p_tarea => :tarea)) gt ORDER BY gt.orden";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '{"subtarea":'.$row['subtarea'].',"orden":'.$row['orden'].'}';
    $rc = true;
  }

  if($out != '') $out = ',"subtareas":[' . $out . ']';

  return $out;

}

function tarea_documentos($tarea) {

  $cnx = sql_connect();

  $sql = "SELECT gt.contador FROM TABLE(pk_web_gtd_xe.get_gtd_tarea_documentos_pipe(p_tarea => :tarea)) gt";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = '';

  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= $row['contador'];
    $rc = true;
  }

  if($out != '') $out = ',"documentos":['.$out.']';
  
  return $out;

}

function tarea_etiquetas($tarea) {

  $cnx = sql_connect();

  $sql = "SELECT gt.etiqueta FROM TABLE(pk_web_gtd_xe.get_gtd_tarea_etiquetas_pipe(p_tarea => :tarea)) gt";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = ',"etiquetas":[';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= $row['etiqueta'];
    $rc = true;
  }

  $out .= ']';
  
  return $out;

}

function tarea_comentarios($tarea) {

  $cnx = sql_connect();

  $sql = "SELECT gt.codigo FROM TABLE(pk_web_gtd_xe.get_gtd_tarea_comentario_pipe(p_tarea => :tarea)) gt";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = '';

  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= $row['codigo'];
    $rc = true;
  }

  if($out != '') $out = ',"comentarios":['.$out.']';
  
  return $out;

}

function tarea_campos_aux($tarea) {

  $cnx = sql_connect();

  $out = '';

  $sql = "SELECT gt.proyecto, gt.campo_aux, gt.tipo_despliegue, gt.valor FROM TABLE(pk_web_gtd_xe.get_gtd_tarea_campos_aux_pipe(p_tarea => :tarea)) gt ORDER BY gt.proyecto, gt.campo_aux";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= ',"campos_aux":{';
  $rc = '';
  while ($row = sql_fetch_array($exec)) {
    if($rc != $row['proyecto']) {
      if ($rc != '') $out .= '},';
      $rc = $row['proyecto'];
      $out .= '"'.$row['proyecto'].'":{';
    } else {
      $out .= ',';
    }
    $out .= '"'.$row['campo_aux'].'_'.$row['tipo_despliegue'].'":"'.convertirhtml($row['valor']).'"';
  }
  if ($rc != '') $out .= '}';
  $out .= '}';

  return $out;

}

function ins_tarea() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $proyecto = $_POST['proyecto'];
  $nombre = $_POST['nombre'] ?? '';
  $seccion = $_POST['seccion'] ?? '';
  $tarea_padre = $_POST['tarea_padre'] ?? '';

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.ins_gtd_tarea(p_proyecto => :proyecto, p_nombre => :nombre, p_seccion => :seccion, p_tarea_padre => :tarea_padre, p_out_tarea => :codigo, p_out_orden => :orden); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":nombre", $nombre, 500);
  oci_bind_by_name($exec, ":seccion", $seccion, 20);
  oci_bind_by_name($exec, ":tarea_padre", $tarea_padre, 20);
  oci_bind_by_name($exec, ":codigo", $codigo, 20);
  oci_bind_by_name($exec, ":orden", $orden, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"codigo":'.$codigo.',"orden":'.$orden.',"resultado":"OK"';

  return $out;

}

function upd_tarea() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $proyecto = $_POST['proyecto'] ?? '';
  $tarea = $_POST['codigo'];
  $campo = $_POST['campo'];
  $valor = $_POST['valor'] ?? '';
  $valor_clob = $_POST['valor_clob'] ?? '';

  $recargar = $_POST['recargar'] ?? 'N';

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.upd_gtd_tarea(p_tarea => :tarea, p_campo => :campo, p_valor => :valor, p_valor_clob => :valor_clob); END;";
  $exec = oci_parse($cnx, $sql);
  $lob = oci_new_descriptor($cnx, OCI_D_LOB);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  oci_bind_by_name($exec, ":campo", $campo, 100);
  oci_bind_by_name($exec, ":valor", $valor, 4000);
  oci_bind_by_name($exec, ":valor_clob",  $lob, -1, OCI_B_CLOB);
  $lob->writeTemporary($valor_clob, OCI_TEMP_CLOB);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  if($recargar === 'N' && ($campo != 'ORDEN' || $proyecto === '')) {
    $out = '"resultado":"OK"';
    if($campo === 'USUARIO_RESPONSABLE') $out .= ','.permisos();
  } else {
    $_POST['tarea'] = '';
    $out = gtd($proyecto);
  }

  return $out;

}

function del_tarea() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $proyecto = $_POST['proyecto'] ?? '';
  $codigo = $_POST['codigo'];

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.del_gtd_tarea(p_tarea => :codigo); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":codigo", $codigo, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  if($proyecto === '') {
    $out = '"resultado":"OK"';
  } else {
    $out = gtd($proyecto);
  }

  return $out;

}

function upd_tarea_seccion() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $tarea = $_POST['tarea'];
  $proyecto = $_POST['proyecto'];
  $nuevo_orden = $_POST['nuevo_orden'];
  $nueva_seccion = $_POST['nueva_seccion'] ?? '';

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.upd_gtd_tarea_seccion(p_tarea => :tarea, p_proyecto => :proyecto, p_nuevo_orden => :nuevo_orden, p_nueva_seccion => :nueva_seccion); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":nuevo_orden", $nuevo_orden, 20);
  oci_bind_by_name($exec, ":nueva_seccion", $nueva_seccion, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $_POST['tarea'] = '';
  $out = gtd($proyecto);

  return $out;

}

function upd_subtarea_orden() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $tarea = $_POST['tarea'];
  $subtarea = $_POST['subtarea'];
  $nuevo_orden = $_POST['nuevo_orden'];

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.upd_gtd_subtarea_orden(p_tarea => :tarea, p_subtarea => :subtarea, p_nuevo_orden => :nuevo_orden); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  oci_bind_by_name($exec, ":subtarea", $subtarea, 20);
  oci_bind_by_name($exec, ":nuevo_orden", $nuevo_orden, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"resultado":"OK"' . subtareas( $tarea );

  return $out;

}

function get_clob_tarea() {

  $cnx = sql_connect();

  $tarea = $_POST['tarea'];

  session_write_close();

  $lob = oci_new_descriptor($cnx, OCI_D_LOB);
  $sql = "BEGIN :clob := pk_web_gtd_xe.get_clob_tarea(p_tarea => :tarea); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  oci_bind_by_name($exec, ':clob', $lob, -1, OCI_B_CLOB);
  if(!oci_execute($exec, OCI_DEFAULT)) return oci_execute_error($exec);

  $foo = '';
  if($lob) {
    while(!$lob->eof()){
      $foo .= $lob->read(2000);
    }
    $lob->free();
  }

  $out = '"resultado":"OK","datos":"'.convertirhtml($foo).'"';

  return $out;

}

function ins_tarea_documento() {

  $out = '';
  $basicupload = $_POST['basicupload'] ?? false;

  // comprobamos si hubo errores en la subida de algún fichero
  if(!empty($_FILES["files"])) {

    $errores = array();
    foreach ($_FILES["files"]["error"] as $key => $error) {
      if ($error != UPLOAD_ERR_OK) {
        $nombre_archivo = $_FILES["files"]["name"][$key];
        $texto_error = devolver_error_fichero($error);
        $errores[] = $nombre_archivo . ': ' . $texto_error;
      }
    }

    if(count($errores) == 0) {

      $cnx = sql_connect();

      $mwl = $_SESSION[_DEF_SESSION_NAME];
      $empresa = $mwl['empresa'];
      $usuario = $mwl['usuario'];

      $tarea = $_POST['tarea'];

      session_write_close();

      $resultado = 'OK';

      // cargamos el array de ficheros, dependiendo de si es una subida básica o multiple
      $files = array();

      if($basicupload) {

        array_push($files, $_FILES["files"]);

      } else {

        foreach ($_FILES["files"]["error"] as $key => $error) {

          $file = array();
          $file["name"] = $_FILES["files"]["name"][$key];
          $file["tmp_name"] = $_FILES["files"]["tmp_name"][$key];
          $file["error"] = $_FILES["files"]["error"][$key];
          $file["type"] = $_FILES["files"]["type"][$key];
          $file["size"] = $_FILES["files"]["size"][$key];

          array_push($files, $file);

        }

      }

      // procesamos el array de ficheros
      foreach ($files as $key => $name) {

         if ($files[$key]['error'] == UPLOAD_ERR_OK) {

           $id_blob = cargar_fichero($files[$key], $cnx);

           $sql = "BEGIN :rdo := pk_web_gtd_xe.ins_gtd_tarea_documento(:empresa, :usuario, :tarea, :id_blob, :nombre); END;";
           $exec = oci_parse($cnx, $sql);
           oci_bind_by_name($exec, ":rdo",  $rdo, 10);
           oci_bind_by_name($exec, ":empresa",  $empresa, 100);
           oci_bind_by_name($exec, ":usuario",  $usuario, 100);
           oci_bind_by_name($exec, ":tarea",  $tarea, 20);
           oci_bind_by_name($exec, ":id_blob",  $id_blob, 20);
           oci_bind_by_name($exec, ":nombre",  $files[$key]["name"], 100);
           if(!oci_execute($exec)) return oci_execute_error($exec);

           if ($rdo != 'OK') {
             $errores[] = 'No se ha podido procesar el fichero ' . $id_blob . ': ' .$files[$key]["name"];
           }

         }

       }

    }

    if(count($errores) > 0) {

      // si no se pudieron mover los ficheros al BLOB_TEMP o hubo errores de subida finalizamos el proceso
      $out .= '"errores":' . json_encode($errores) . ',';
      $resultado = 'MAL';

    }

  } else {
    $resultado = 'MAL';
  }

  $out .= '"resultado": "'.$resultado.'"';

  if($basicupload) {
    header("Content-type: text/plain; charset=utf-8");
    header('Content-Disposition', 'inline; filename="response.json"');
    echo '{'.$out.'}';
    die();
  } else {
    return $out;
  };

}

function del_tarea_documento() {

  $cnx = sql_connect();

  session_write_close();

  $tarea = $_POST['tarea'];
  $contador = $_POST['contador'];

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.del_gtd_tarea_documento(p_tarea => :tarea, p_contador => :contador); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  oci_bind_by_name($exec, ":contador", $contador, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"resultado": "OK"';

  return $out;

}

function set_tarea_campo_aux() {

  $cnx = sql_connect();

  session_write_close();

  $tarea = $_POST['tarea'];
  $campo_aux = $_POST['campo_aux'];
  $tipo_despliegue = $_POST['tipo_despliegue'];
  $proyecto = $_POST['proyecto'];
  $valor = $_POST['valor'] ?? '';

  $recargar = $_POST['recargar'] ?? 'N';

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.set_gtd_tarea_campo_aux(p_tarea => :tarea, p_campo_aux => :campo_aux, p_tipo_despliegue => :tipo_despliegue, p_proyecto => :proyecto, p_valor => :valor); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  oci_bind_by_name($exec, ":campo_aux", $campo_aux, 20);
  oci_bind_by_name($exec, ":tipo_despliegue", $tipo_despliegue, 1);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":valor", $valor, 500);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  if($recargar === 'N') {
    $out = '"resultado":"OK"';
  } else {
    $_POST['tarea'] = '';
    $out = gtd($proyecto);
  }

  return $out;

}

function etiquetas($init) {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $out = '';

  $sql = "SELECT gt.codigo, gt.nombre, gt.color FROM TABLE(pk_web_gtd_xe.get_gtd_etiquetas_pipe()) gt";
  $exec = oci_parse($cnx, $sql);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"etiquetas":[';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '{"codigo":'.$row['codigo'].',"nombre":"'.convertirhtml($row['nombre']).'"';
    if($row['color'] != '') $out .= ',"color":"'.$row['color'].'"';
    $out .= '}';
    $rc = true;
  }

  $out .= '],';

  if(!$init) $out .= '"resultado": "OK"';

  return $out;

}

function upd_etiqueta() {

  $cnx = sql_connect();

  asignar_variables_sesion($cnx, $_POST);
  session_write_close();

  $etiqueta = $_POST['etiqueta'];
  $campo = $_POST['campo'];
  $valor = $_POST['valor'] ?? '';

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.upd_gtd_etiqueta(p_etiqueta => :etiqueta, p_campo => :campo, p_valor => :valor); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":etiqueta", $etiqueta, 20);
  oci_bind_by_name($exec, ":campo", $campo, 100);
  oci_bind_by_name($exec, ":valor", $valor, 4000);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"OK"';

  return $out;

}

function ins_tarea_etiqueta() {

  $cnx = sql_connect();

  session_write_close();

  $tarea = $_POST['tarea'];
  $etiqueta = $_POST['etiqueta'] ?? '';
  $nombre = $_POST['nombre'] ?? '';

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.ins_gtd_tarea_etiqueta(p_tarea => :tarea, p_etiqueta => :etiqueta, p_nombre => :nombre, p_out_color => :out_color); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  oci_bind_by_name($exec, ":etiqueta", $etiqueta, 20);
  oci_bind_by_name($exec, ":nombre", $nombre, 100);
  oci_bind_by_name($exec, ":out_color", $out_color, 100);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"etiqueta":'.$etiqueta.',"color":"'.$out_color.'","resultado": "OK"';

  return $out;

}

function del_tarea_etiqueta() {

  $cnx = sql_connect();

  session_write_close();

  $tarea = $_POST['tarea'];
  $etiqueta = $_POST['etiqueta'];

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.del_gtd_tarea_etiqueta(p_tarea => :tarea, p_etiqueta => :etiqueta, p_out_limpiar_etiqueta => :out_limpiar_etiqueta); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":tarea", $tarea, 20);
  oci_bind_by_name($exec, ":etiqueta", $etiqueta, 20);
  oci_bind_by_name($exec, ":out_limpiar_etiqueta", $out_limpiar_etiqueta, 1);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"limpiar_etiqueta":"'.$out_limpiar_etiqueta.'","resultado": "OK"';

  return $out;

}


function ins_tarea_comentario() {

  $out = '';
 
  $cnx = sql_connect();

  $tarea = $_POST['tarea'];
  $codigo = $_POST['codigo'] ?? '';
  $comentario = $_POST['comentario'];
  if(!empty($comentario)) $comentario = str_replace(array("\r", "\n"), '', $comentario);
  $codigo_padre = $_POST['codigo_padre'] ?? '';

  session_write_close();

  $resultado = 'OK';

  $sql = "BEGIN pk_web_gtd_xe.ins_gtd_tarea_comentario(p_tarea => :tarea, p_inout_codigo => :codigo, p_comentario => :comentario, p_codigo_padre => :codigo_padre); END;";
  $exec = oci_parse($cnx, $sql);
  $lob = oci_new_descriptor($cnx, OCI_D_LOB);
  oci_bind_by_name($exec, ":tarea",  $tarea, 20);
  oci_bind_by_name($exec, ":codigo",  $codigo, 20);
  oci_bind_by_name($exec, ":comentario",  $lob, -1, OCI_B_CLOB);
  oci_bind_by_name($exec, ":codigo_padre",  $codigo_padre, 20);
  $lob->writeTemporary($comentario, OCI_TEMP_CLOB);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"resultado": "'.$resultado.'","codigo": "'.$codigo.'"';
  return $out;

}

function del_tarea_comentario() {

  $cnx = sql_connect();

  session_write_close();

  $comentario = $_POST['comentario'];

  $out = '';

  $sql = "BEGIN pk_web_gtd_xe.del_gtd_tarea_comentario(p_comentario => :comentario); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":comentario", $comentario, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"resultado": "OK"';

  return $out;

}

function campos_aux_proyecto($proyecto) {

  $cnx = sql_connect();

  $out = '';

  $sql = "SELECT gt.codigo, gt.tipo_despliegue, gt.nombre, gt.tipo, gt.descripcion, gt.activo, gt.mostrar_en_lista, gt.orden, gt.lista_valores, gt.aplica_color_tarea FROM TABLE(pk_web_gtd_xe.get_gtd_campos_aux_pipe(p_proyecto => :proyecto)) gt ORDER BY gt.tipo_despliegue, gt.orden";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= ',"campos_aux":[';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '{"campo":"'.$row['codigo'].'_'.$row['tipo_despliegue'].'","nombre":"'.convertirhtml($row['nombre']).'","tipo":"'.$row['tipo'].'","activo":"'.$row['activo'].'","orden":'.$row['orden'];
    if($row['descripcion'] != '') $out .= ',"descripcion":"'.$row['descripcion'].'"';
    if($row['mostrar_en_lista'] != '') $out .= ',"mostrar_en_lista":"'.$row['mostrar_en_lista'].'"';
    if($row['lista_valores'] != '') $out .= ',"lista_valores":"'.$row['lista_valores'].'"';
    if($row['aplica_color_tarea'] == 'S') $out .= ',"aplica_color_tarea":"'.$row['aplica_color_tarea'].'"';
    $out .= campos_aux_valores($proyecto, $row['codigo'], $row['tipo_despliegue'], $row['tipo']);
    $out .= '}';
    $rc = true;
  }

  $out .= ']';

  return $out;

}

function campos_aux_valores($proyecto, $campo_aux, $tipo_despliegue, $tipo) {

  $cnx = sql_connect();

  $out = ',"valores":[';

  if($tipo === 'S') {

    $sql = "SELECT gt.codigo, gt.valor, gt.orden, gt.color FROM TABLE(pk_web_gtd_xe.get_gtd_campos_aux_val_pipe(p_proyecto => :proyecto, p_campo_aux => :campo_aux, p_tipo_despliegue => :tipo_despliegue)) gt ORDER BY gt.orden";
    $exec = oci_parse($cnx, $sql);
    oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
    oci_bind_by_name($exec, ":campo_aux", $campo_aux, 20);
    oci_bind_by_name($exec, ":tipo_despliegue", $tipo_despliegue, 20);
    if(!oci_execute($exec)) return oci_execute_error($exec);

    $rc = false;
    while ($row = sql_fetch_array($exec)) {
      if ($rc) $out .= ',';
      $out .= '{"codigo":'.$row['codigo'].',"valor":"'.convertirhtml($row['valor']).'","orden":'.$row['orden'];
      if($row['color'] != '') $out .= ',"color":"'.$row['color'].'"';
      $out .= '}';
      $rc = true;
    }

  } else if($tipo === 'L' && (isset($_POST['proyecto']) && $_POST['proyecto'] === $proyecto)) {
    
    $sql = "SELECT gt.codigo, gt.descripcion FROM TABLE(pk_web_gtd_xe.get_gtd_campo_aux_lv_val_pipe(p_proyecto => :proyecto, p_campo_aux => :campo_aux, p_tipo_despliegue => :tipo_despliegue)) gt ORDER BY gt.descripcion";
    $exec = oci_parse($cnx, $sql);
    oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
    oci_bind_by_name($exec, ":campo_aux", $campo_aux, 20);
    oci_bind_by_name($exec, ":tipo_despliegue", $tipo_despliegue, 20);
    if(!oci_execute($exec)) return oci_execute_error($exec);

    $rc = false;
    while ($row = sql_fetch_array($exec)) {
      if ($rc) $out .= ',';
      $out .= '{"codigo":"'.$row['codigo'].'","descripcion":"'.convertirhtml($row['descripcion']).'"}';
      $rc = true;
    }

  }

  $out .= ']';

  return $out;

}

function usuarios_proyecto($proyecto) {

  $cnx = sql_connect();

  $out = '';

  $sql = "SELECT gt.usuario, gt.supervisor, gt.origen_registro, gt.perfil, gt.equipo FROM TABLE(pk_web_gtd_xe.get_gtd_usuarios_proyecto(p_proyecto => :proyecto)) gt";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out .= ',"usuarios":[';
  $rc = false;
  while ($row = sql_fetch_array($exec)) {
    if ($rc) $out .= ',';
    $out .= '{"usuario":"'.$row['usuario'].'","supervisor":"'.$row['supervisor'].'","origen":"'.$row['origen_registro'].'"';
    if($row['perfil'] != '' && $row['perfil'] != 'NULL') $out .= ',"perfil":"'.$row['perfil'].'"';
    if($row['equipo'] != '' && $row['equipo'] != 'NULL') $out .= ',"equipo":"'.$row['equipo'].'"';
    $out .= '}';
    $rc = true;
  }

  $out .= ']';

  return $out;

}

function set_campo_aux() {

  $cnx = sql_connect();

  session_write_close();

  $proyecto = $_POST['p_proyecto'];
  $campo_aux = $_POST['p_codigo'] ?? '';
  $tipo_despliegue = $_POST['p_tipo_despliegue'] ?? 'P';
  $nombre = $_POST['p_nombre'] ?? '';
  $tipo = $_POST['p_tipo'] ?? 'A';
  $descripcion = $_POST['p_descripcion'] ?? '';
  $mostrar_en_lista = $_POST['p_mostrar_en_lista'] ?? 'N';
  $orden = $_POST['p_orden'] ?? '';
  $valores = $_POST['p_valores'] ?? '{"valores":[]}';
  $lista_valores = $_POST['p_lista_valores'] ?? '';
  $aplica_color_tarea = $_POST['p_aplica_color_tarea'] ?? '';

  $sql = "BEGIN pk_web_gtd_xe.set_gtd_campo_aux(p_proyecto => :proyecto, p_campo_aux => :campo_aux, p_tipo_despliegue => :tipo_despliegue, p_nombre => :nombre, p_tipo => :tipo, p_descripcion => :descripcion, p_mostrar_en_lista => :mostrar_en_lista, p_orden => :orden, p_valores => :valores, p_lista_valores => :lista_valores, p_aplica_color_tarea => :aplica_color_tarea); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":campo_aux", $campo_aux, 20);
  oci_bind_by_name($exec, ":tipo_despliegue", $tipo_despliegue, 1);
  oci_bind_by_name($exec, ":nombre", $nombre, 100);
  oci_bind_by_name($exec, ":tipo", $tipo, 10);
  oci_bind_by_name($exec, ":descripcion", $descripcion, 4000);
  oci_bind_by_name($exec, ":mostrar_en_lista", $mostrar_en_lista, 1);
  oci_bind_by_name($exec, ":orden", $orden, 20);
  oci_bind_by_name($exec, ":valores", $valores, 32000);
  oci_bind_by_name($exec, ":lista_valores", $lista_valores, 30);
  oci_bind_by_name($exec, ":aplica_color_tarea", $aplica_color_tarea, 1);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = gtd($proyecto);

  return $out;

}

function upd_campo_aux() {

  $cnx = sql_connect();

  session_write_close();

  $proyecto = $_POST['proyecto'];
  $campo_aux = $_POST['codigo'] ?? '';
  $tipo_despliegue = $_POST['tipo_despliegue'] ?? 'P';
  $orden = $_POST['orden'] ?? '';
  $activo = $_POST['activo'] ?? '';

  $sql = "BEGIN pk_web_gtd_xe.upd_gtd_campo_aux(p_proyecto => :proyecto, p_campo_aux => :campo_aux, p_tipo_despliegue => :tipo_despliegue, p_activo => :activo, p_orden => :orden); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":campo_aux", $campo_aux, 20);
  oci_bind_by_name($exec, ":tipo_despliegue", $tipo_despliegue, 1);
  oci_bind_by_name($exec, ":activo", $activo, 1);
  oci_bind_by_name($exec, ":orden", $orden, 20);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = gtd($proyecto);

  return $out;

}

function del_campo_aux() {

  $cnx = sql_connect();

  session_write_close();

  $proyecto = $_POST['proyecto'];
  $campo_aux = $_POST['codigo'] ?? '';
  $tipo_despliegue = $_POST['tipo_despliegue'] ?? 'P';

  $sql = "BEGIN pk_web_gtd_xe.del_gtd_campo_aux(p_proyecto => :proyecto, p_campo_aux => :campo_aux, p_tipo_despliegue => :tipo_despliegue); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":campo_aux", $campo_aux, 20);
  oci_bind_by_name($exec, ":tipo_despliegue", $tipo_despliegue, 1);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = gtd($proyecto);

  return $out;

}

function set_proyecto_permiso() {

  $cnx = sql_connect();

  session_write_close();

  $proyecto = $_POST['proyecto'];
  $tipo_autorizacion = $_POST['tipo_autorizacion'] ?? 'U';
  $codigo = $_POST['codigo'] ?? '';
  $supervisor = $_POST['supervisor'] ?? 'N';

  $sql = "BEGIN pk_web_gtd_xe.set_gtd_proyecto_permiso(p_proyecto => :proyecto, p_tipo_autorizacion => :tipo_autorizacion, p_codigo => :codigo, p_supervisor => :supervisor); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":tipo_autorizacion", $tipo_autorizacion, 1);
  oci_bind_by_name($exec, ":codigo", $codigo, 100);
  oci_bind_by_name($exec, ":supervisor", $supervisor, 1);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = gtd($proyecto);

  return $out;

}

function upd_proyecto_permiso() {

  $cnx = sql_connect();

  session_write_close();

  $proyecto = $_POST['proyecto'];
  $tipo_autorizacion = $_POST['tipo_autorizacion'] ?? 'U';
  $codigo = $_POST['codigo'] ?? '';
  $accion = $_POST['accion'] ?? '';

  $sql = "BEGIN pk_web_gtd_xe.upd_gtd_proyecto_permiso(p_proyecto => :proyecto, p_tipo_autorizacion => :tipo_autorizacion, p_codigo => :codigo, p_accion => :accion); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":tipo_autorizacion", $tipo_autorizacion, 1);
  oci_bind_by_name($exec, ":codigo", $codigo, 100);
  oci_bind_by_name($exec, ":accion", $accion, 100);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = gtd($proyecto);

  return $out;

}

function del_proyecto_permiso() {

  $cnx = sql_connect();

  session_write_close();

  $proyecto = $_POST['proyecto'];
  $tipo_autorizacion = $_POST['tipo_autorizacion'] ?? 'U';
  $codigo = $_POST['codigo'] ?? '';

  $sql = "BEGIN pk_web_gtd_xe.del_gtd_proyecto_permiso(p_proyecto => :proyecto, p_tipo_autorizacion => :tipo_autorizacion, p_codigo => :codigo); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 20);
  oci_bind_by_name($exec, ":tipo_autorizacion", $tipo_autorizacion, 1);
  oci_bind_by_name($exec, ":codigo", $codigo, 100);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  $out = gtd($proyecto);

  return $out;

}

function set_opcion_usuario() {

  $cnx = sql_connect();

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $usuario = $mwl['usuario'];

  session_write_close();

  $opcion = $_POST['opcion'] ?? '';
  $valor = $_POST['valor'] ?? '';

  $sql = "BEGIN pk_web_gtd_xe.set_gtd_opcion_usuario(p_usuario => :usuario, p_opcion => :opcion, p_valor => :valor); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":usuario", $usuario, 100);
  oci_bind_by_name($exec, ":opcion", $opcion, 100);
  oci_bind_by_name($exec, ":valor", $valor, 100);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  die();

}

function set_opcion_usuario_seccion() {

  $cnx = sql_connect();

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $usuario = $mwl['usuario'];

  session_write_close();

  $proyecto = $_POST['proyecto'] ?? '';
  $seccion = $_POST['seccion'] ?? '';
  $opcion = $_POST['opcion'] ?? '';
  $valor = $_POST['valor'] ?? '';

  $sql = "BEGIN pk_web_gtd_xe.set_gtd_opcion_usuario_seccion(p_usuario => :usuario, p_proyecto => :proyecto, p_seccion => :seccion, p_opcion => :opcion, p_valor => :valor); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":usuario", $usuario, 100);
  oci_bind_by_name($exec, ":proyecto", $proyecto, 100);
  oci_bind_by_name($exec, ":seccion", $seccion, 100);
  oci_bind_by_name($exec, ":opcion", $opcion, 100);
  oci_bind_by_name($exec, ":valor", $valor, 100);
  if(!oci_execute($exec)) return oci_execute_error($exec);

  die();

}