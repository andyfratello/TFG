<?php

function controller( $args ) {

  if(carga_sesion()) {

    switch( $args[0] ) {

      case 'carga_erp':
        $foo = carga_erp();
        break;

      case 'get_data':
        $foo = get_data();
        break;

      case 'actualizar_datos_tarea':
        $foo = actualizar_datos_tarea();
        break;

      case 'es_simulacion_en_uso':
        $foo = es_simulacion_en_uso();
        break;

      case 'rehacer_tablas':
        $foo = rehacer_tablas();
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

  $modulo = 'p_ccmaqs';

  $out = load_erp($modulo, $cnx);

  $menu = $_SESSION[_DEF_SESSION_NAME.'-'.$GLOBALS['modulo']]['menu'];
  $pass = ($menu['password'] == '') ? 'N' : 'S';
  $out .= '"password": "'.$pass.'",';

  $out .= '"resultado": "OK"';

  return $out;

}

function get_data() {
  $cnx = sql_connect();
  session_write_close();
  $codigo_org_planta = $_POST['codigo_org_planta'];
  $numero_simulacion = $_POST['numero_simulacion'];
  $hasta_proyecto = $_POST['hasta_proyecto'];
  $desde_proyecto = $_POST['desde_proyecto'];
  $hasta_maquina = $_POST['hasta_maquina'];
  $desde_maquina = $_POST['desde_maquina'];
  $hasta_orden_fabricacion = $_POST['hasta_orden_fabricacion'];
  $desde_orden_fabricacion = $_POST['desde_orden_fabricacion'];
  $fecha_fin_prevista = $_POST['fecha_fin_prevista'];
  $fecha_ini_prevista = $_POST['fecha_ini_prevista'];
  $desde_seccion = $_POST['desde_seccion'];
  $hasta_seccion = $_POST['hasta_seccion'];
  $desde_tipo_maquina = $_POST['desde_tipo_maquina'];
  $hasta_tipo_maquina = $_POST['hasta_tipo_maquina'];

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];

  //$tasks = ''; // Tasks JSON
  //$resources = ''; // Resources JSON

  $out = '';
  $links = '';
  $linkID = 1;

  // Execute the PL/SQL Function for Tasks
  $sqlTasks = "SELECT id_sesion, numero_simulacion, codigo_org_planta, orden_de_fabricacion, secuencia, fase, linea, tipo, fecha_ini, fecha_fin, recurso, desc_recurso, porc_completado, y, nexttask, nextrecurso, recurso_libra FROM TABLE(pk_web_p_ccmaqs_xe.get_ofs_graph(:numero_simulacion, :codigo_org_planta, :empresa, :hasta_proyecto, :desde_proyecto, :hasta_maquina, :desde_maquina, :hasta_orden_fabricacion, :desde_orden_fabricacion, :fecha_fin_prevista, :fecha_ini_prevista, :desde_seccion, :hasta_seccion, :desde_tipo_maquina, :hasta_tipo_maquina))";
  $exec = oci_parse($cnx, $sqlTasks);
  oci_bind_by_name($exec, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($exec, ":numero_simulacion", $numero_simulacion, 100);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":hasta_proyecto", $hasta_proyecto, 100);
  oci_bind_by_name($exec, ":desde_proyecto", $desde_proyecto, 100);
  oci_bind_by_name($exec, ":hasta_maquina", $hasta_maquina, 100);
  oci_bind_by_name($exec, ":desde_maquina", $desde_maquina, 100);
  oci_bind_by_name($exec, ":hasta_orden_fabricacion", $hasta_orden_fabricacion, 100);
  oci_bind_by_name($exec, ":desde_orden_fabricacion", $desde_orden_fabricacion, 100);
  oci_bind_by_name($exec, ":fecha_fin_prevista", $fecha_fin_prevista, 100);
  oci_bind_by_name($exec, ":fecha_ini_prevista", $fecha_ini_prevista, 100);
  oci_bind_by_name($exec, ":desde_seccion", $desde_seccion, 100);
  oci_bind_by_name($exec, ":hasta_seccion", $hasta_seccion, 100);
  oci_bind_by_name($exec, ":desde_tipo_maquina", $desde_tipo_maquina, 100);
  oci_bind_by_name($exec, ":hasta_tipo_maquina", $hasta_tipo_maquina, 100);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out .= '"tareas":{';
  $out .= '"data":[';
  $rc = false;

  while ($row = oci_fetch_assoc($exec)) {
    $porcentaje = $row['PORC_COMPLETADO']/100;
    $idMasUno = $row['Y'] + 1;
    $out .= '{"id":' . $idMasUno . ',"text":"' . $row['ORDEN_DE_FABRICACION'] . '/' . $row['SECUENCIA'] . '","type": "task","start_date":"' . $row['FECHA_INI'] . '","end_date":"' . $row['FECHA_FIN'] . '","progress":' . $porcentaje . ',"readonly": false,"owner": [{"resource_id": "' . $row['RECURSO_LIBRA'] . '", "value": 2}]},';
    // links entre tareas
    if ($row['NEXTTASK'] != -1) {
      $links .= '{"id":' . $linkID . ',"source":' . $idMasUno . ',"target":' . $row['NEXTTASK'] . ',"type":"0"},';
      $linkID++;
    }
  }

  $out = rtrim($out, ',');
  $links = rtrim($links, ',');

  $out .= '],"links": [';
  $out .= $links;
  $out .= ']},';

  oci_free_statement($exec);

  // Execute the PL/SQL Function for Resources
  $sqlResources = "SELECT orden_de_fabricacion, secuencia, codigo_articulo, recurso, desc_recurso, y, nexttask, nextrecurso, recurso_libra FROM TABLE(pk_web_p_ccmaqs_xe.get_recursos_graph(:numero_simulacion, :codigo_org_planta, :empresa, :hasta_proyecto, :desde_proyecto, :hasta_maquina, :desde_maquina, :hasta_orden_fabricacion, :desde_orden_fabricacion, :fecha_fin_prevista, :fecha_ini_prevista, :desde_seccion, :hasta_seccion, :desde_tipo_maquina, :hasta_tipo_maquina))";
  $execResources = oci_parse($cnx, $sqlResources);
  oci_bind_by_name($execResources, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($execResources, ":numero_simulacion", $numero_simulacion, 100);
  oci_bind_by_name($execResources, ":empresa", $empresa, 100);
  oci_bind_by_name($execResources, ":hasta_proyecto", $hasta_proyecto, 100);
  oci_bind_by_name($execResources, ":desde_proyecto", $desde_proyecto, 100);
  oci_bind_by_name($execResources, ":hasta_maquina", $hasta_maquina, 100);
  oci_bind_by_name($execResources, ":desde_maquina", $desde_maquina, 100);
  oci_bind_by_name($execResources, ":hasta_orden_fabricacion", $hasta_orden_fabricacion, 100);
  oci_bind_by_name($execResources, ":desde_orden_fabricacion", $desde_orden_fabricacion, 100);
  oci_bind_by_name($execResources, ":fecha_fin_prevista", $fecha_fin_prevista, 100);
  oci_bind_by_name($execResources, ":fecha_ini_prevista", $fecha_ini_prevista, 100);
  oci_bind_by_name($execResources, ":desde_seccion", $desde_seccion, 100);
  oci_bind_by_name($execResources, ":hasta_seccion", $hasta_seccion, 100);
  oci_bind_by_name($execResources, ":desde_tipo_maquina", $desde_tipo_maquina, 100);
  oci_bind_by_name($execResources, ":hasta_tipo_maquina", $hasta_tipo_maquina, 100);

  if (!oci_execute($execResources)) return oci_execute_error($execResources);

  $out .= '"recursos":[';
  $rc = false;

  while ($row = oci_fetch_assoc($execResources)) {
    $out .= '{"id": "' . $row['RECURSO_LIBRA'] . '","text": "' . $row['DESC_RECURSO'] . '"},';
  }

  $out = rtrim($out, ',');
  $out .= ']';

  oci_free_statement($execResources);
  oci_close($cnx);

  return $out;
}


function actualizar_datos_tarea() {
  $cnx = sql_connect();
  session_write_close();

  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $planta = $_POST['planta'];
  $simulacion = $_POST['simulacion'];
  $orden_de_fabricacion = $_POST['orden_de_fabricacion'];
  $secuencia = $_POST['secuencia'];
  $fecha_inicio = $_POST['fecha_inicio'];
  /*
  $cambio_recurso = $_POST['cambio_recurso'];
  $desde_proyecto = $_POST['desde_proyecto'];
  $hasta_proyecto = $_POST['hasta_proyecto'];
  $desde_maquina = $_POST['desde_maquina'];
  $hasta_maquina = $_POST['hasta_maquina'];
  $desde_of = $_POST['desde_of'];
  $hasta_of = $_POST['hasta_of'];
  $desde_fecha_aux = $_POST['desde_fecha_aux'];
  $hasta_fecha_aux = $_POST['hasta_fecha_aux'];
  $desde_seccion = $_POST['desde_seccion'];
  $hasta_seccion = $_POST['hasta_seccion'];
  $desde_tipo_maquina = $_POST['desde_tipo_maquina'];
  $hasta_tipo_maquina = $_POST['hasta_tipo_maquina'];
  $recalcular_al_mover = $_POST['recalcular_al_mover'];*/

  $out = '';
  $result = '';

  // Execute the PL/SQL Function for Tasks
  //$sql = "BEGIN :result := pk_web_p_ccmaqs_xe.actualizar_datos_tarea(:empresa, :planta, :simulacion, :orden_de_fabricacion, :secuencia, :fecha_inicio, :cambio_recurso, :desde_proyecto, :hasta_proyecto, :desde_maquina, :hasta_maquina, :desde_of, :hasta_of, :desde_fecha_aux, :hasta_fecha_aux, :desde_seccion, :hasta_seccion, :desde_tipo_maquina, :hasta_tipo_maquina, :recalcular_al_mover); END;";
  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.actualizar_datos_tarea(:empresa, :planta, :simulacion, :orden_de_fabricacion, :secuencia, :fecha_inicio); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":planta", $planta, 100);
  oci_bind_by_name($exec, ":simulacion", $simulacion, 100);
  oci_bind_by_name($exec, ":orden_de_fabricacion", $orden_de_fabricacion, 100);
  oci_bind_by_name($exec, ":secuencia", $secuencia, 100);
  oci_bind_by_name($exec, ":fecha_inicio", $fecha_inicio, 100);
  
  /*
  oci_bind_by_name($exec, ":cambio_recurso", $cambio_recurso, 100);
  oci_bind_by_name($exec, ":desde_proyecto", $desde_proyecto, 100);
  oci_bind_by_name($exec, ":hasta_proyecto", $hasta_proyecto, 100);
  oci_bind_by_name($exec, ":desde_maquina", $desde_maquina, 100);
  oci_bind_by_name($exec, ":hasta_maquina", $hasta_maquina, 100);
  oci_bind_by_name($exec, ":desde_of", $desde_of, 100);
  oci_bind_by_name($exec, ":hasta_of", $hasta_of, 100);
  oci_bind_by_name($exec, ":desde_fecha_aux", $desde_fecha_aux, 100);
  oci_bind_by_name($exec, ":hasta_fecha_aux", $hasta_fecha_aux, 100);
  oci_bind_by_name($exec, ":desde_seccion", $desde_seccion, 100);
  oci_bind_by_name($exec, ":hasta_seccion", $hasta_seccion, 100);
  oci_bind_by_name($exec, ":desde_tipo_maquina", $desde_tipo_maquina, 100);
  oci_bind_by_name($exec, ":hasta_tipo_maquina", $hasta_tipo_maquina, 100);
  oci_bind_by_name($exec, ":recalcular_al_mover", $recalcular_al_mover, 100);*/

  oci_bind_by_name($exec, ":result", $result, SQLT_CHR);

  if (!oci_execute($exec)) {
    return oci_execute_error($exec);
  }

  $out = '"resultado":"' . $result . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function es_simulacion_en_uso() {
  $cnx = sql_connect();
  session_write_close();

  $codigo_org_planta = $_POST['codigo_org_planta'];
  $numero_simulacion = $_POST['numero_simulacion'];
  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];

  $out = '';

  $result = 0;

  // Execute the PL/SQL Function for Tasks
  $sql = "BEGIN :result := pk_web_p_ccmaqs_xe.es_simulacion_en_uso(:empresa, :codigo_org_planta, :numero_simulacion); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($exec, ":numero_simulacion", $numero_simulacion, 100);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":result", $result, SQLT_INT);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"' . $result . '"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}


function rehacer_tablas() {
  $cnx = sql_connect();
  session_write_close();

  $codigo_org_planta = $_POST['codigo_org_planta'];
  $numero_simulacion = $_POST['numero_simulacion'];
  $mwl = $_SESSION[_DEF_SESSION_NAME];
  $empresa = $mwl['empresa'];
  $hasta_proyecto = $_POST['hasta_proyecto'];
  $desde_proyecto = $_POST['desde_proyecto'];
  $hasta_maquina = $_POST['hasta_maquina'];
  $desde_maquina = $_POST['desde_maquina'];
  $hasta_orden_fabricacion = $_POST['hasta_orden_fabricacion'];
  $desde_orden_fabricacion = $_POST['desde_orden_fabricacion'];
  $fecha_fin_prevista = $_POST['fecha_fin_prevista'];
  $fecha_ini_prevista = $_POST['fecha_ini_prevista'];
  $desde_seccion = $_POST['desde_seccion'];
  $hasta_seccion = $_POST['hasta_seccion'];
  $desde_tipo_maquina = $_POST['desde_tipo_maquina'];
  $hasta_tipo_maquina = $_POST['hasta_tipo_maquina'];

  $out = '';

  // Execute the PL/SQL Function for Tasks
  $sql = "BEGIN pk_web_p_ccmaqs_xe.rehacer_tablas(:numero_simulacion, :codigo_org_planta, :empresa, :hasta_proyecto, :desde_proyecto, :hasta_maquina, :desde_maquina, :hasta_orden_fabricacion, :desde_orden_fabricacion, :fecha_fin_prevista, :fecha_ini_prevista, :desde_seccion, :hasta_seccion, :desde_tipo_maquina, :hasta_tipo_maquina); END;";
  $exec = oci_parse($cnx, $sql);
  oci_bind_by_name($exec, ":codigo_org_planta", $codigo_org_planta, 100);
  oci_bind_by_name($exec, ":numero_simulacion", $numero_simulacion, 100);
  oci_bind_by_name($exec, ":empresa", $empresa, 100);
  oci_bind_by_name($exec, ":hasta_proyecto", $hasta_proyecto, 100);
  oci_bind_by_name($exec, ":desde_proyecto", $desde_proyecto, 100);
  oci_bind_by_name($exec, ":hasta_maquina", $hasta_maquina, 100);
  oci_bind_by_name($exec, ":desde_maquina", $desde_maquina, 100);
  oci_bind_by_name($exec, ":hasta_orden_fabricacion", $hasta_orden_fabricacion, 100);
  oci_bind_by_name($exec, ":desde_orden_fabricacion", $desde_orden_fabricacion, 100);
  oci_bind_by_name($exec, ":fecha_fin_prevista", $fecha_fin_prevista, 100);
  oci_bind_by_name($exec, ":fecha_ini_prevista", $fecha_ini_prevista, 100);
  oci_bind_by_name($exec, ":desde_seccion", $desde_seccion, 100);
  oci_bind_by_name($exec, ":hasta_seccion", $hasta_seccion, 100);
  oci_bind_by_name($exec, ":desde_tipo_maquina", $desde_tipo_maquina, 100);
  oci_bind_by_name($exec, ":hasta_tipo_maquina", $hasta_tipo_maquina, 100);

  if (!oci_execute($exec)) return oci_execute_error($exec);

  $out = '"resultado":"OK"';

  oci_free_statement($exec);
  oci_close($cnx);

  return $out;
}