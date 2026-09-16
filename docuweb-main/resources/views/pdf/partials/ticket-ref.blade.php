@if($caso->ticket)
    <div class="ticket-ref"><strong>TICKET #{{ $caso->ticket->numero }}</strong> — {{ $caso->ticket->titulo }}</div>
@elseif($caso->redmine_numero)
    <div class="ticket-ref"><strong>REDMINE #{{ $caso->redmine_numero }}</strong>{{ $caso->redmine_url ? ' — ' . $caso->redmine_url : '' }}</div>
@endif
