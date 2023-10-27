Imports System.Data.OracleClient
Public Class Grafico2

    Private fecha_original, fecha_final, fecha_inicio, hora_inicio As Date
    Private drag As Boolean
    Private barra_fecha, linea_ruta, fase As Integer
    Private funcion As New Funciones
    Private orden_de_fabricacion, secuencia As Integer
    Private codigo_empresa, codigo_org_planta, numero_simulacion, recurso As String
    Private Sub SCH_GRAFICO_PROYECTOSBindingNavigatorSaveItem_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles SCH_GRAFICO_PROYECTOSBindingNavigatorSaveItem.Click
        Me.Validate()
        Me.SCH_GRAFICO_PROYECTOSBindingSource.EndEdit()
        Me.TableAdapterManager.UpdateAll(Form1.dataset2)
    End Sub

    Private Sub Grafico2_Load(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles MyBase.Load
        ToolStripComboBox1.SelectedIndex = 2

        SCH_GRAFICO_PROYECTOSBindingSource.DataSource = Form1.dataset2.Tables(0)
        'SCH_GRAFICO_PROYECTOSDataGridView.DataSource = Form1.dataset2.Tables(0).DefaultView
        'TODO: esta línea de código carga datos en la tabla 'DataSet1.SCH_GRAFICO_PROYECTOS' Puede moverla o quitarla según sea necesario.
        'Me.SCH_GRAFICO_PROYECTOSTableAdapter.Fill(Me.DataSet1.SCH_GRAFICO_PROYECTOS, Form1.codigo_org_planta, Form1.codigo_empresa, Form1.simulacion, Form1.id_sesion, 2)
        Dim mycmd As New OracleCommand
        Dim myconn As New OracleConnection(funcion.getcadenaconexion_oracleclient())
        myconn.Open()
        mycmd.Connection = myconn

        'mycmd.CommandText = "SELECT CODIGO_EMPRESA, CODIGO_ORG_PLANTA, NUMERO_SIMULACION, ORDEN_DE_FABRICACION, SECUENCIA, FASE, LINEA, TIPO, CODIGO_ARTICULO, DESC_ARTICULO, CODIGO_CLIENTE, DESC_CLIENTE, FECHA_INI, FECHA_FIN, RECURSO, DESC_RECURSO, CANT_ACEPTADA, CANT_A_FABRICAR, PORC_COMPLETADO, SITU_RUTA, PROYECTO, ORGANIZACION_COMPRAS, SERIE_NUMERACION, NUMERO_PEDIDO, CODIGO_PROVEEDOR, DESC_PROVEEDOR, Y, NEXTTASK, NEXTRECURSO, RECURSO_LIBRA, ID_SESION FROM SCH_GRAFICO_PROYECTOS WHERE CODIGO_ORG_PLANTA = :CODIGO_ORG_PLANTA AND CODIGO_EMPRESA = :CODIGO_EMPRESA AND NUMERO_SIMULACION = :NUMERO_SIMULACION AND ID_SESION = :ID_SESION AND NIVEL = :NIVEL ORDER BY Y"
        'mycmd.Parameters.Add(New OracleParameter("CODIGO_ORG_PLANTA", OracleType.VarChar)).Value = Form1.codigo_org_planta
        'mycmd.Parameters.Add(New OracleParameter("CODIGO_EMPRESA", OracleType.VarChar)).Value = Form1.codigo_empresa
        'mycmd.Parameters.Add(New OracleParameter("NUMERO_SIMULACION", OracleType.VarChar)).Value = Form1.simulacion
        'mycmd.Parameters.Add(New OracleParameter("ID_SESION", OracleType.VarChar)).Value = Form1.id_sesion
        'mycmd.Parameters.Add(New OracleParameter("NIVEL", OracleType.VarChar)).Value = ToolStripComboBox1.SelectedIndex


        'Dim myReader As OracleDataReader = mycmd.ExecuteReader()
        'Dim da As New OracleDataAdapter(mycmd)
        'da.Fill(Form1.dataset2)

        'SCH_GRAFICO_PROYECTOSDataGridView.DataSource = Form1.dataset2.Tables(0).DefaultView

        'myReader.Close()
        'myReader = Nothing

        'mycmd.Parameters.Clear()

        Me.Text = "Simulación: " & Form1.dataset2.Tables(0).Rows(0).Item("NUMERO_SIMULACION")
        Try
            mycmd.CommandText = "Select titulo_grafico from sch_grafico_cab where codigo_empresa = " & Form1.dataset2.Tables(0).Rows(0).Item("CODIGO_EMPRESA") & " and codigo_org_planta = " & Form1.dataset2.Tables(0).Rows(0).Item("CODIGO_ORG_PLANTA") & " and tipo_grafico = 'P'"
            TChart1.Header.Text = mycmd.ExecuteScalar
            mycmd.CommandText = "Select leyenda from sch_grafico_cab where codigo_empresa = " & Form1.dataset2.Tables(0).Rows(0).Item("CODIGO_EMPRESA") & " and codigo_org_planta = " & Form1.dataset2.Tables(0).Rows(0).Item("CODIGO_ORG_PLANTA") & " and tipo_grafico = 'P'"
            If mycmd.ExecuteScalar = "S" Then
                TChart1.Legend.Visible = True
            Else
                TChart1.Legend.Visible = False
            End If

        Catch ex As NullReferenceException
            '  MessageBox.Show("No hay insertado un título para este gráfico en el Mantenimiento de Gráficos", "Información", MessageBoxButtons.OK, MessageBoxIcon.Information)
            TChart1.Header.Text = "Secciones"
        End Try

        'Inicializo el gráfico
        TChart1.Aspect.View3D = 0
        TChart1.Axes.Left.Inverted = True
        GanttTool1.CursorDrag = Cursors.Default
        funcion.cargar_BD(Me.Gantt1, Form1.dataset2.Tables(0))
        SCH_GRAFICO_PROYECTOSDataGridView.Font = New Font("Arial", 8)
        ComboBox1.SelectedIndex = 1
        TChart1.Axes.Left.Labels.Align = Steema.TeeChart.AxisLabelAlign.Opposite
        TChart1.Axes.Left.Labels.AutoSize = True
        TChart1.Axes.Left.Labels.Separation = 0
        CheckBox1.Checked = False
        CheckBox3.Checked = False
        ComboBox2.SelectedIndex = 0
        'TChart1.Axes.Left.MaximumOffset = -Me.DataSet1.Tables(1).Rows.Count
        'TChart1.Axes.Left.MinimumOffset = -Me.DataSet1.Tables(1).Rows.Count
        Gantt1.Pointer.VertSize = 6
        ComboBox1.SelectedIndex = 3
        TChart1.Aspect.SmoothingMode = Drawing2D.SmoothingMode.None
        TextBox1.Text = 0
        Referencias.Checked = True

        If Form1.formato_fecha = "MM/DD/YYYY" Then
            TChart1.Axes.Bottom.Labels.DateTimeFormat = "MM/dd/yyyy"
        End If
    End Sub

    Private Sub CheckBox1_CheckedChanged(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles CheckBox1.CheckedChanged
        funcion.cambiar_aspecto(Me.TChart1)
    End Sub
    Private Sub Grafico2_Resize(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Resize
        Dim anchura As New Integer
        Dim altura As New Integer
        anchura = Me.Size.Width - 110
        altura = Me.Size.Height - 230
        TChart1.Size = New Size(anchura, altura)
        SCH_GRAFICO_PROYECTOSDataGridView.Size = New Size(anchura, 130)
        SCH_GRAFICO_PROYECTOSDataGridView.Location = New System.Drawing.Point(SCH_GRAFICO_PROYECTOSDataGridView.Location.X, TChart1.Size.Height + 60)
        ' CheckBox1.Location = New System.Drawing.Point(CheckBox1.Location.X, TChart1.Size.Height + 30)
        ' CheckBox3.Location = New System.Drawing.Point(CheckBox3.Location.X, TChart1.Size.Height + 30)
        ' ComboBox1.Location = New System.Drawing.Point(ComboBox1.Location.X, TChart1.Size.Height + 30)
        ' Label1.Location = New System.Drawing.Point(Label1.Location.X, TChart1.Size.Height + 30)
        ' CheckBox2.Location = New System.Drawing.Point(CheckBox2.Location.X, TChart1.Size.Height + 30)
        ' ComboBox2.Location = New System.Drawing.Point(ComboBox2.Location.X, TChart1.Size.Height + 30)
        ' TextBox1.Location = New System.Drawing.Point(TextBox1.Location.X, TChart1.Size.Height + 30)
        ' Button1.Location = New System.Drawing.Point(Button1.Location.X, TChart1.Size.Height + 30)
        ' Button2.Location = New System.Drawing.Point(Button2.Location.X, TChart1.Size.Height + 30)
        ' CheckMover.Location = New System.Drawing.Point(CheckMover.Location.X, TChart1.Size.Height + 30)
    End Sub
    Private Sub SCH_GRAFICO_PROYECTOSDataGridView_CellValueChanged(ByVal sender As Object, ByVal e As System.Windows.Forms.DataGridViewCellEventArgs) Handles SCH_GRAFICO_PROYECTOSDataGridView.CellValueChanged
        Dim valor As String
        Dim filas As Integer
        Dim fila_modificada As Integer
        Try
            If SCH_GRAFICO_PROYECTOSDataGridView.CurrentCell.ColumnIndex = 5 Then
                valor = SCH_GRAFICO_PROYECTOSDataGridView.CurrentCell.Value
                fila_modificada = SCH_GRAFICO_PROYECTOSDataGridView.CurrentCell.RowIndex
                filas = Form1.dataset2.Tables(0).Rows.Count - 1
                For i = 0 To filas
                    If Form1.dataset2.Tables(0).Rows(i).Item("RECURSO") = valor Then
                        If i <> fila_modificada Then
                            Form1.dataset2.Tables(0).Rows(fila_modificada).Item("Y") = Form1.dataset2.Tables(0).Rows(i).Item("Y")
                            Exit For
                        End If
                    End If
                Next
            End If
            TChart1.Series(0).CheckDataSource()
        Catch ex As Exception
        End Try
    End Sub
    Private Sub SCH_GRAFICO_PROYECTOSDataGridView_CellEnter(ByVal sender As Object, ByVal e As System.Windows.Forms.DataGridViewCellEventArgs) Handles SCH_GRAFICO_PROYECTOSDataGridView.CellEnter
        funcion.pintar_barras(Me.Gantt1, ComboBox1.SelectedIndex, Form1.dataset2.Tables(0), Me.SCH_GRAFICO_PROYECTOSDataGridView, False)
    End Sub

    Private Sub ComboBox1_SelectedIndexChanged(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles ComboBox1.SelectedIndexChanged

        funcion.tabla_colores(Form1.dataset2.Tables(0), ComboBox1.SelectedIndex)
        funcion.pintar_barras(Me.Gantt1, ComboBox1.SelectedIndex, Form1.dataset2.Tables(0), Me.SCH_GRAFICO_PROYECTOSDataGridView, True)
    End Sub
    Private Sub TChart1_ClickSeries(ByVal sender As Object, ByVal s As Steema.TeeChart.Styles.Series, ByVal valueIndex As Integer, ByVal e As System.Windows.Forms.MouseEventArgs) Handles TChart1.ClickSeries

        orden_de_fabricacion = Form1.dataset2.Tables(0).Rows(valueIndex).Item("ORDEN_DE_FABRICACION")
        secuencia = Form1.dataset2.Tables(0).Rows(valueIndex).Item("SECUENCIA")
        codigo_empresa = Form1.dataset2.Tables(0).Rows(valueIndex).Item("CODIGO_EMPRESA")
        codigo_org_planta = Form1.dataset2.Tables(0).Rows(valueIndex).Item("CODIGO_ORG_PLANTA")
        numero_simulacion = Form1.dataset2.Tables(0).Rows(valueIndex).Item("NUMERO_SIMULACION")
        linea_ruta = Form1.dataset2.Tables(0).Rows(valueIndex).Item("LINEA")
        recurso = Form1.dataset2.Tables(0).Rows(valueIndex).Item("RECURSO")
        fase = Form1.dataset2.Tables(0).Rows(valueIndex).Item("FASE")
        Dim filas As Integer
        filas = Form1.dataset2.Tables(0).Rows.Count - 1
        For i = 0 To filas
            If numero_simulacion = Form1.dataset2.Tables(0).Rows(i).Item("NUMERO_SIMULACION") Then
                If orden_de_fabricacion = Form1.dataset2.Tables(0).Rows(i).Item("ORDEN_DE_FABRICACION") Then
                    If secuencia = Form1.dataset2.Tables(0).Rows(i).Item("SECUENCIA") Then
                        If codigo_org_planta = Form1.dataset2.Tables(0).Rows(i).Item("CODIGO_ORG_PLANTA") Then
                            If codigo_empresa = Form1.dataset2.Tables(0).Rows(i).Item("CODIGO_EMPRESA") Then
                                SCH_GRAFICO_PROYECTOSDataGridView.Rows(i).Selected = True
                                SCH_GRAFICO_PROYECTOSDataGridView.CurrentCell = SCH_GRAFICO_PROYECTOSDataGridView.Rows(i).Cells(0)
                                fecha_original = Form1.dataset2.Tables(0).Rows(valueIndex).Item("FECHA_INI")
                                Calendario.MonthCalendar1.SelectionStart = fecha_original
                                Calendario.MonthCalendar1.SelectionEnd = fecha_original
                                Exit For
                            End If
                        End If
                    End If
                End If
            End If
        Next
    End Sub
    Private Sub GanttTool1_DragBar(ByVal sender As Object, ByVal e As Steema.TeeChart.Tools.GanttDragEventArgs) Handles GanttTool1.DragBar
        fecha_inicio = Strings.FormatDateTime(Date.FromOADate(TChart1.Series(0).Item(e.Bar).X), DateFormat.ShortDate)
        hora_inicio = Strings.FormatDateTime(Date.FromOADate(TChart1.Series(0).Item(e.Bar).X), DateFormat.ShortTime)
        Form1.dataset2.Tables(0).Rows(e.Bar).Item("FECHA_INI") = fecha_inicio
        fecha_final = Form1.dataset2.Tables(0).Rows(e.Bar).Item("FECHA_FIN")
        Calendario.MonthCalendar1.SelectionStart = fecha_inicio
        Calendario.MonthCalendar1.SelectionEnd = fecha_inicio
        barra_fecha = e.Bar
        drag = True

    End Sub

    Private Sub TChart1_MouseUp(ByVal sender As Object, ByVal e As System.Windows.Forms.MouseEventArgs) Handles TChart1.MouseUp


        Dim mycmd As New OracleCommand
        Dim myconn As New OracleConnection(funcion.getcadenaconexion_oracleclient())
        myconn.Open()
        mycmd.Connection = myconn
        Dim v_mensaje As String

        Dim fecha As String = Format(CDate(fecha_inicio), "dd/MM/yyyy") 'fecha_inicio
        Dim hora As String = Format(CDate(hora_inicio), "HH:mm:ss")  'hora_inicio
        fecha = fecha.Replace("/", "")
        'MessageBox.Show(fecha)
        hora = hora.Replace(":", "")
        If hora.Length = 5 Then
            hora = "0" & hora
        End If
        'Cambio las 00 por las 12 en caso que sea necesario
        'If hora.Substring(0, 2) = "00" Then
        ' hora = "12" & hora.Substring(2, 4)
        ' End If

        fecha = fecha & hora
        mycmd.CommandType = CommandType.StoredProcedure
        'mycmd.CommandText = "sch_actualiza_datos('" & codigo_empresa & "','" & codigo_org_planta & "'," & orden_de_fabricacion & "," & linea_ruta & ",'" & numero_simulacion & "','" & recurso & "'," & fase & "," & secuencia & ")"
        'mycmd.ExecuteNonQuery()
        mycmd.CommandText = "sch_carga_maquinas.calcula_fecha_fin('" & codigo_empresa & "','" & codigo_org_planta & "','" & numero_simulacion & "'," & orden_de_fabricacion & "," & secuencia & "," & fecha & "," & False & ", '" & Form1.desde_proyecto & "', '" & Form1.hasta_proyecto & "', '" & Form1.desde_maquina & "', '" & Form1.hasta_maquina & "', '" & Form1.desde_of & "', '" & Form1.hasta_of & "', '" & Form1.desde_fecha & "', '" & Form1.hasta_fecha & "', '" & Form1.desde_seccion & "', '" & Form1.hasta_seccion & "', '" & Form1.desde_tipo_maquina & "', '" & Form1.hasta_tipo_maquina & "'," & CheckMover.Checked & ")"
        ' mycmd.Parameters.Add(New OleDb.OleDbParameter("mensaje", OleDb.OleDbType.Variant)).Direction = ParameterDirection.ReturnValue
        mycmd.Parameters.Add(New OracleParameter("mensaje", OleDb.OleDbType.Variant)).Direction = ParameterDirection.ReturnValue

        'Si se ha arrastrado alguna barra calculamos su nueva fecha_fin
        If drag = True Then
            drag = False
            Try
                mycmd.ExecuteNonQuery()
                'v_mensaje = mycmd.Parameters(0).Value

            Catch ex As Exception
                MessageBox.Show(mycmd.CommandText)
                MessageBox.Show(ex.Message)
            End Try
            mycmd.Parameters.Clear()
            mycmd.CommandType = CommandType.Text
            ' v_mensaje = mycmd.Parameters(0).Value
            'MessageBox.Show(v_mensaje, "Información", MessageBoxButtons.OK, MessageBoxIcon.Information)
            'TODO: esta línea de código carga datos en la tabla 'DataSet1.SCH_GRAFICO_RECURSOS' Puede moverla o quitarla según sea necesario.
            ' Me.SCH_GRAFICO_PROYECTOSTableAdapter.Fill(Me.DataSet1.SCH_GRAFICO_PROYECTOS, Form1.codigo_org_planta, Form1.codigo_empresa, Form1.simulacion, Form1.id_sesion, 2)

            mycmd.CommandText = "SELECT CODIGO_EMPRESA, CODIGO_ORG_PLANTA, NUMERO_SIMULACION, ORDEN_DE_FABRICACION, SECUENCIA, FASE, LINEA, TIPO, CODIGO_ARTICULO, DESC_ARTICULO, CODIGO_CLIENTE, DESC_CLIENTE, FECHA_INI, FECHA_FIN, RECURSO, DESC_RECURSO, CANT_ACEPTADA, CANT_A_FABRICAR, PORC_COMPLETADO, SITU_RUTA, PROYECTO, ORGANIZACION_COMPRAS, SERIE_NUMERACION, NUMERO_PEDIDO, CODIGO_PROVEEDOR, DESC_PROVEEDOR, Y, NEXTTASK, NEXTRECURSO, RECURSO_LIBRA, ID_SESION FROM SCH_GRAFICO_PROYECTOS WHERE CODIGO_ORG_PLANTA = :CODIGO_ORG_PLANTA AND CODIGO_EMPRESA = :CODIGO_EMPRESA AND NUMERO_SIMULACION = :NUMERO_SIMULACION AND ID_SESION = :ID_SESION AND NIVEL = :NIVEL ORDER BY Y"
            mycmd.Parameters.Add(New OracleParameter("CODIGO_ORG_PLANTA", OracleType.VarChar)).Value = Form1.codigo_org_planta
            mycmd.Parameters.Add(New OracleParameter("CODIGO_EMPRESA", OracleType.VarChar)).Value = Form1.codigo_empresa
            mycmd.Parameters.Add(New OracleParameter("NUMERO_SIMULACION", OracleType.VarChar)).Value = Form1.simulacion
            mycmd.Parameters.Add(New OracleParameter("ID_SESION", OracleType.VarChar)).Value = Form1.id_sesion
            mycmd.Parameters.Add(New OracleParameter("NIVEL", OracleType.VarChar)).Value = "2"

            Dim myReader As OracleDataReader = mycmd.ExecuteReader()
            Dim da As New OracleDataAdapter(mycmd)
            Try
                Form1.dataset2.Clear()
            Catch ex As Exception
            End Try
            da.Fill(Form1.dataset2)

            ' SCH_GRAFICO_PROYECTOSDataGridView.DataSource = Form1.dataset2.Tables(0).DefaultView
            SCH_GRAFICO_PROYECTOSDataGridView.Refresh()

            myReader.Close()

            mycmd.Parameters.Clear()


            Gantt1.CheckDataSource()


            '11/08/2017 funcion.tabla_colores(Form1.dataset2.Tables(0), ComboBox1.SelectedIndex)
            funcion.pintar_barras(Me.Gantt1, Me.ComboBox1.SelectedIndex, Form1.dataset2.Tables(0), Me.SCH_GRAFICO_PROYECTOSDataGridView, True)




        End If

    End Sub

    Private Sub CheckBox2_CheckedChanged(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles CheckBox2.CheckedChanged
        GanttTool1.AllowDrag = CheckBox2.Checked
    End Sub
    Private Sub Gantt1_GetSeriesMark(ByVal series As Steema.TeeChart.Styles.Series, ByVal e As Steema.TeeChart.Styles.GetSeriesMarkEventArgs) Handles Gantt1.GetSeriesMark
        funcion.Mostrar_Marcas(Form1.dataset2.Tables(0), series, e, ComboBox2.SelectedIndex)
    End Sub
    Private Sub ComboBox2_SelectedIndexChanged(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles ComboBox2.SelectedIndexChanged
        Gantt1.Marks.Visible = False
        If ComboBox2.SelectedIndex <> 0 Then
            Gantt1.Marks.Visible = True
        End If
    End Sub

    Private Sub CheckBox3_CheckedChanged(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles CheckBox3.CheckedChanged
        Try
            funcion.offset_grafico(Me.TChart1, CheckBox3.Checked, Me.DataSet1.Tables(1), TextBox1.Text)
        Catch ex As Exception
        End Try
    End Sub

    Private Sub ToolStripButton1_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles ToolStripButton1.Click
        Dim mycmd As New OracleCommand
        Dim myconn As New OracleConnection(funcion.getcadenaconexion_oracleclient())
        myconn.Open()
        mycmd.Connection = myconn
        Dim opcion As Integer
        opcion = MessageBox.Show("¿Desea actualizar también las cabeceras de las O.F?", "Atención", MessageBoxButtons.YesNoCancel, MessageBoxIcon.Question)
        mycmd.CommandType = CommandType.StoredProcedure
        ' opcion = 7 el cliente pulsa NO
        ' opcion = 6 el cliente pulsa SI
        ' si el cliente pulsa CANCELAR no ejecutamos ninguna función
        If opcion = 7 Then
            mycmd.CommandText = "sch_carga_maquinas.generar_simulacion('" & Form1.dataset2.Tables(0).Rows(0).Item("CODIGO_EMPRESA") & "','" & Form1.dataset2.Tables(0).Rows(0).Item("CODIGO_ORG_PLANTA") & "','" & Form1.dataset2.Tables(0).Rows(0).Item("NUMERO_SIMULACION") & "'," & False & ")"
            mycmd.ExecuteNonQuery()
        ElseIf opcion = 6 Then
            mycmd.CommandText = "sch_carga_maquinas.generar_simulacion('" & Form1.dataset2.Tables(0).Rows(0).Item("CODIGO_EMPRESA") & "','" & Form1.dataset2.Tables(0).Rows(0).Item("CODIGO_ORG_PLANTA") & "','" & Form1.dataset2.Tables(0).Rows(0).Item("NUMERO_SIMULACION") & "'," & True & ")"
            mycmd.ExecuteNonQuery()
        End If
    End Sub

    Public Sub actualiza_zoom()
        If ToolStripTextBox1.Text <> "" And ToolStripTextBox2.Text <> "" Then
            Dim fecha_inicio_zoom As Date
            Dim fecha_fin_zoom As Date

            If Form1.formato_fecha = "MM/DD/YYYY" Then
                fecha_inicio_zoom = DateTime.ParseExact(ToolStripTextBox1.Text, "MM/dd/yyyy", Nothing)
                fecha_fin_zoom = DateTime.ParseExact(ToolStripTextBox2.Text, "MM/dd/yyyy", Nothing)
            Else
                fecha_inicio_zoom = ToolStripTextBox1.Text
                fecha_fin_zoom = ToolStripTextBox2.Text
            End If
            TChart1.Axes.Bottom.SetMinMax(fecha_inicio_zoom, fecha_fin_zoom)
        End If
    End Sub

    Private Sub ToolStripTextBox1_LostFocus(ByVal sender As Object, ByVal e As System.EventArgs) Handles ToolStripTextBox1.LostFocus
        actualiza_zoom()
    End Sub

    Private Sub ToolStripTextBox2_LostFocus(ByVal sender As Object, ByVal e As System.EventArgs) Handles ToolStripTextBox2.LostFocus
        actualiza_zoom()
    End Sub

    Private Sub ToolStripComboBox1_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles ToolStripComboBox1.SelectedIndexChanged
        Dim mycmd As New OracleCommand
        Dim myconn As New OracleConnection(funcion.getcadenaconexion_oracleclient())
        myconn.Open()
        mycmd.Connection = myconn

        mycmd.CommandType = CommandType.StoredProcedure
        mycmd.CommandText = "sch_carga_maquinas.cambia_nivel_visualizado(" & Form1.id_sesion & ", '" & Form1.codigo_empresa & "','" & Form1.codigo_org_planta & "','" & Form1.simulacion & "'," & ToolStripComboBox1.SelectedIndex & ")"

        mycmd.ExecuteNonQuery()

        mycmd.CommandText = "SELECT CODIGO_EMPRESA, CODIGO_ORG_PLANTA, NUMERO_SIMULACION, ORDEN_DE_FABRICACION, SECUENCIA, FASE, LINEA, TIPO, CODIGO_ARTICULO, DESC_ARTICULO, CODIGO_CLIENTE, DESC_CLIENTE, FECHA_INI, FECHA_FIN, RECURSO, DESC_RECURSO, CANT_ACEPTADA, CANT_A_FABRICAR, PORC_COMPLETADO, SITU_RUTA, PROYECTO, ORGANIZACION_COMPRAS, SERIE_NUMERACION, NUMERO_PEDIDO, CODIGO_PROVEEDOR, DESC_PROVEEDOR, Y, NEXTTASK, NEXTRECURSO, RECURSO_LIBRA, ID_SESION FROM SCH_GRAFICO_PROYECTOS WHERE CODIGO_ORG_PLANTA = :CODIGO_ORG_PLANTA AND CODIGO_EMPRESA = :CODIGO_EMPRESA AND NUMERO_SIMULACION = :NUMERO_SIMULACION AND ID_SESION = :ID_SESION AND NIVEL = :NIVEL ORDER BY Y"
        mycmd.Parameters.Add(New OracleParameter("CODIGO_ORG_PLANTA", OracleType.VarChar)).Value = Form1.codigo_org_planta
        mycmd.Parameters.Add(New OracleParameter("CODIGO_EMPRESA", OracleType.VarChar)).Value = Form1.codigo_empresa
        mycmd.Parameters.Add(New OracleParameter("NUMERO_SIMULACION", OracleType.VarChar)).Value = Form1.simulacion
        mycmd.Parameters.Add(New OracleParameter("ID_SESION", OracleType.VarChar)).Value = Form1.id_sesion
        mycmd.Parameters.Add(New OracleParameter("NIVEL", OracleType.VarChar)).Value = ToolStripComboBox1.SelectedIndex

        mycmd.CommandType = CommandType.Text

        Dim myReader As OracleDataReader = mycmd.ExecuteReader()
        Dim da As New OracleDataAdapter(mycmd)

        Try
            'Form1.dataset2.Tables(0).Reset()
            Form1.dataset2.Clear()
        Catch ex As Exception
        End Try
        da.Fill(Form1.dataset2)

        ' SCH_GRAFICO_PROYECTOSDataGridView.DataSource = Form1.dataset2.Tables(0).DefaultView
        'SCH_GRAFICO_PROYECTOSDataGridView.DataSource = Nothing
        SCH_GRAFICO_PROYECTOSDataGridView.Refresh()




        myReader.Close()
        myReader = Nothing

        mycmd.Parameters.Clear()
        myconn.Close()

        Gantt1.CheckDataSource()
        funcion.pintar_barras(Me.Gantt1, ComboBox1.SelectedIndex, Form1.dataset2.Tables(0), Me.SCH_GRAFICO_PROYECTOSDataGridView, False)

    End Sub

    Private Sub Button1_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles Button1.Click
        TextBox1.Text = TextBox1.Text - 10
        CheckBox3.Checked = False
    End Sub

    Private Sub Button2_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles Button2.Click
        TextBox1.Text = TextBox1.Text + 10
        CheckBox3.Checked = False
    End Sub
    Private Sub TextBox1_TextChanged(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles TextBox1.TextChanged
        funcion.separacion_barras(Me.TChart1, TextBox1.Text)
    End Sub

    Private Sub Referencias_CheckedChanged(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles Referencias.CheckedChanged
        If Referencias.Checked = True Then
            Gantt1.ConnectingPen.Visible = True
        Else
            Gantt1.ConnectingPen.Visible = False
        End If
    End Sub

    Private Sub ToolStripButton2_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles ToolStripButton2.Click
        Calendario.Show()
    End Sub

    Private Sub SCH_GRAFICO_PROYECTOSBindingNavigator_RefreshItems(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles SCH_GRAFICO_PROYECTOSBindingNavigator.RefreshItems

    End Sub

    Private Sub ToolStripButton3_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles ToolStripButton3.Click
        Dim mycmd As New OracleCommand
        Dim myconn As New OracleConnection(funcion.getcadenaconexion_oracleclient())
        Dim v_nada As Integer
        myconn.Open()
        mycmd.Connection = myconn

        mycmd.CommandType = CommandType.StoredProcedure
        mycmd.CommandText = "sch_carga_maquinas.calcula_fecha_fin('" & Form1.codigo_empresa & "','" & Form1.codigo_org_planta & "','" & Form1.simulacion & "'," & v_nada & "," & v_nada & "," & v_nada & "," & True & ", '" & Form1.desde_proyecto & "', '" & Form1.hasta_proyecto & "', '" & Form1.desde_maquina & "', '" & Form1.hasta_maquina & "', '" & Form1.desde_of & "', '" & Form1.hasta_of & "', '" & Form1.desde_fecha & "', '" & Form1.hasta_fecha & "', '" & Form1.desde_seccion & "', '" & Form1.hasta_seccion & "', '" & Form1.desde_tipo_maquina & "', '" & Form1.hasta_tipo_maquina & "'," & CheckMover.Checked & ")"
        mycmd.Parameters.Add(New OracleParameter("mensaje", OleDb.OleDbType.Variant)).Direction = ParameterDirection.ReturnValue

        Try
            mycmd.ExecuteNonQuery()
            'v_mensaje = mycmd.Parameters(0).Value

        Catch ex As Exception
            MessageBox.Show(mycmd.CommandText)
            MessageBox.Show(ex.Message)
        End Try
        mycmd.Parameters.Clear()
        mycmd.CommandType = CommandType.Text
       
        mycmd.CommandText = "SELECT CODIGO_EMPRESA, CODIGO_ORG_PLANTA, NUMERO_SIMULACION, ORDEN_DE_FABRICACION, SECUENCIA, FASE, LINEA, TIPO, CODIGO_ARTICULO, DESC_ARTICULO, CODIGO_CLIENTE, DESC_CLIENTE, FECHA_INI, FECHA_FIN, RECURSO, DESC_RECURSO, CANT_ACEPTADA, CANT_A_FABRICAR, PORC_COMPLETADO, SITU_RUTA, PROYECTO, ORGANIZACION_COMPRAS, SERIE_NUMERACION, NUMERO_PEDIDO, CODIGO_PROVEEDOR, DESC_PROVEEDOR, Y, NEXTTASK, NEXTRECURSO, RECURSO_LIBRA, ID_SESION FROM SCH_GRAFICO_PROYECTOS WHERE CODIGO_ORG_PLANTA = :CODIGO_ORG_PLANTA AND CODIGO_EMPRESA = :CODIGO_EMPRESA AND NUMERO_SIMULACION = :NUMERO_SIMULACION AND ID_SESION = :ID_SESION AND NIVEL = :NIVEL ORDER BY Y"
        mycmd.Parameters.Add(New OracleParameter("CODIGO_ORG_PLANTA", OracleType.VarChar)).Value = Form1.codigo_org_planta
        mycmd.Parameters.Add(New OracleParameter("CODIGO_EMPRESA", OracleType.VarChar)).Value = Form1.codigo_empresa
        mycmd.Parameters.Add(New OracleParameter("NUMERO_SIMULACION", OracleType.VarChar)).Value = Form1.simulacion
        mycmd.Parameters.Add(New OracleParameter("ID_SESION", OracleType.VarChar)).Value = Form1.id_sesion
        mycmd.Parameters.Add(New OracleParameter("NIVEL", OracleType.VarChar)).Value = "2"

        Dim myReader As OracleDataReader = mycmd.ExecuteReader()
        Dim da As New OracleDataAdapter(mycmd)
        Try
            Form1.dataset2.Clear()
        Catch ex As Exception
        End Try
        da.Fill(Form1.dataset2)

        SCH_GRAFICO_PROYECTOSDataGridView.Refresh()

        myReader.Close()

        mycmd.Parameters.Clear()


        Gantt1.CheckDataSource()


        '11/08/2017 funcion.tabla_colores(Form1.dataset2.Tables(0), ComboBox1.SelectedIndex)
        funcion.pintar_barras(Me.Gantt1, Me.ComboBox1.SelectedIndex, Form1.dataset2.Tables(0), Me.SCH_GRAFICO_PROYECTOSDataGridView, True)


    End Sub

    Private Sub ToolStripButton4_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles ToolStripButton4.Click
        Dim mycmd As New OracleCommand
        Dim myconn As New OracleConnection(funcion.getcadenaconexion_oracleclient())
        myconn.Open()
        mycmd.Connection = myconn

        mycmd.CommandType = CommandType.StoredProcedure
        mycmd.CommandText = "sch_carga_maquinas.cambia_status_actividad('" & Form1.codigo_empresa & "','" & Form1.codigo_org_planta & "','" & Form1.simulacion & "',0,0,0," & False & ")"
        Try
            mycmd.ExecuteNonQuery()
        Catch ex As Exception
        End Try
    End Sub
End Class